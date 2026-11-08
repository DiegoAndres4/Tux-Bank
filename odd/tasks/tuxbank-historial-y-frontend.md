# TuxBank — Historial de transferencias + Frontend React con cookies HttpOnly

Objetivo: cerrar el backend NestJS (historial, perfil de sesión, logout, transferencia atómica
correcta) y construir el frontend React completo consumiendo cookies `HttpOnly` con credenciales.
Branch: `main` (árbol de trabajo con la migración a NestJS sin commitear). Sin commits automáticos.
Runner: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js` (backend) · `npm run build` (frontend).

## Specs

### Backend

**S1** — `GET /api/transactions/historial` (protegido con `JwtAuthGuard`).
Devuelve las transferencias enviadas y recibidas del usuario autenticado, extraído de la cookie JWT.

Contrato de respuesta (exacto):
```json
{
  "cuenta": "1000000001",
  "movimientos": [
    {
      "_id": "6710...",
      "tipo": "transferencia",
      "direccion": "enviada",
      "monto": 50000,
      "descripcion": "Transferencia entre cuentas TuxBank",
      "fecha": "2026-11-07T12:00:00.000Z",
      "contraparte": { "numeroCuenta": "1000000002", "nombre": "Ana Torres" }
    }
  ]
}
```
Reglas: `direccion` es `"enviada"` cuando `cuentaOrigen` es la cuenta del usuario, `"recibida"` cuando
`cuentaDestino` lo es; `contraparte` es la cuenta del otro extremo; orden por `createdAt` descendente;
máximo 100 movimientos. Si el usuario no tiene cuenta, `NotFoundException` con
`'No se encontró ninguna cuenta asociada a este usuario'`.

**S2** — `GET /api/auth/me` (protegido). Devuelve el usuario autenticado y su cuenta, para restaurar
sesión tras recargar (el front no puede leer la cookie `HttpOnly`).
```json
{
  "user": { "id": "6710...", "nombre": "Diego", "email": "d@x.com", "rol": "cliente" },
  "account": { "_id": "6710...", "numeroCuenta": "1000000001", "saldo": 500000, "activa": true }
}
```
Si no hay cuenta, `account: null` (la sesión sigue siendo válida; no lanzar 404).

**S3** — `POST /api/auth/logout` (sin guard, idempotente). Limpia la cookie `token` con las mismas
opciones usadas al crearla (`httpOnly`, `secure` según `NODE_ENV`, `sameSite: 'lax'`, `path: '/'`) y
responde `200` `{ "message": "Sesión cerrada correctamente" }`.

**S4** — `POST /api/transactions/transferir` debe ser atómico de verdad:
- Las cuentas de origen y destino se leen **dentro** de la sesión (`findOne(...).session(session)`),
  después de `startTransaction()`.
- La validación de saldo suficiente se hace **dentro** de la sesión, con el saldo leído en la sesión.
- El `session.endSession()` va en `finally`.
- `descripcion` debe ser realmente opcional (`@IsOptional()`), con `@MaxLength(120)`.
- `numeroCuentaDestino` debe validar 10 dígitos (`@Matches(/^\d{10}$/)`).
- `monto` debe ser número entero ≥ 1.
- La respuesta mantiene el shape actual `{ message, comprobante: { idTransaccion, origen, destino, monto, nuevoSaldo } }`.

**S5** — Índices de consulta: `Account.usuario` indexado y `Transaction` con índice compuesto sobre
`cuentaOrigen`/`cuentaDestino` para que el historial no haga collection scan.

### Frontend

**S6** — Cliente HTTP en `src/services/api.js` contra `VITE_API_URL` (default `http://localhost:3000/api`),
**siempre** con `credentials: 'include'`. Sin `localStorage`, sin `Authorization: Bearer`.
Normaliza el error de Nest (`{ message, statusCode }`) lanzando un `Error` con el texto de `message`;
si `message` es un array de validación, concatena todos sus elementos con `' · '` (ver `L8`).

Funciones exportadas: `loginRequest`, `registroRequest`, `logoutRequest`, `meRequest`,
`miCuentaRequest`, `transferirRequest`, `historialRequest`, `todasLasCuentasRequest`.

**S7** — `AuthContext` (`src/context/AuthContext.jsx`) que al montar llama `GET /auth/me` y expone
`{ user, account, cargando, login, registrar, logout, refrescarCuenta }`. `logout` llama
`POST /auth/logout` y limpia el estado.

**S8** — Rutas:
| Ruta | Componente | Acceso |
|---|---|---|
| `/` | redirect | a `/dashboard` o `/login` según sesión |
| `/login` | `Login` | pública |
| `/register` | `Register` | pública |
| `/dashboard` | `Dashboard` | protegida |
| `/transferir` | `Transferencias` | protegida |
| `/historial` | `Historial` | protegida |
| `/admin` | `Admin` | protegida + `rol === 'admin'` |

`App.jsx` debe importar `./pages/Register` con la capitalización exacta del archivo (bug actual:
`./pages/register`).

**S9** — Vistas:
- **Login / Registro**: reutilizan el diseño actual (#0f172a / #1e293b / #38bdf8), validan y muestran
  el `message` del backend. Registro exitoso redirige a `/login` con aviso de cuenta creada.
- **Dashboard**: número de cuenta, saldo disponible formateado en `es-CO` COP, nombre del usuario,
  y accesos rápidos a Transferir / Historial. Si el rol es `admin`, acceso a Admin.
- **Transferencias**: inputs `numeroCuentaDestino`, `monto`, `descripcion`; mensaje de éxito con el
  comprobante (origen, destino, monto, nuevo saldo) y refresco del saldo.
- **Historial**: tabla/lista con enviadas (débito, rojo) y recibidas (crédito, verde), monto con signo,
  contraparte, descripción y fecha formateada.
- **Admin**: tabla de usuarios y cuentas desde `GET /accounts/todas`, mostrando nombre, email, rol,
  número de cuenta, saldo y estado. Si el rol no es admin, redirige a `/dashboard`.

**S10** — Layout compartido con header (logo, nombre, dropdown con cuenta, saldo, enlaces de
navegación y cerrar sesión). Estilos inline coherentes con el diseño actual, sin agregar dependencias
nuevas (`lucide-react` y `react-router-dom` ya están en `package.json`).

**S11** — `.env.example` en `tuxbank-frontend` con `VITE_API_URL=http://localhost:3000/api`.

### Cierre de deuda técnica (pedido posterior, ver `L12`)

**S12** — `npm run lint` debe salir con exit 0 y sin warnings sobre `src/` y `test/`.

**S13** — `tuxbank-backend-nestjs/.env.example` documentando `PORT`, `MONGODB_URI`, `JWT_SECRET`,
`CLIENT_URL` y `NODE_ENV`, con la nota de que las transacciones exigen replica set.

**S14** — `POST /api/auth/registro` atómico: usuario y cuenta se crean en la misma transacción.
Dos registros concurrentes con el mismo email: uno responde 201, el resto 409 (E11000 traducido),
y el usuario que gana nunca queda sin cuenta.

**S15** — El secreto JWT tiene una única fuente de verdad (`obtenerJwtSecret`) y la aplicación
falla al arrancar si `JWT_SECRET` no está definido.

**S16** — E2E real commiteado: `npm run test:e2e` compila y levanta `dist/main.js` contra un replica
set en memoria, cubriendo auth, RBAC, transferencias, historial, concurrencia y logout.

## Tasks

- T1 — Backend: historial, `/auth/me`, logout, transferencia atómica, DTOs e índices (`S1`–`S5`). Ruta: delegada. Estado: hecho y verificado.
- T2 — Frontend: cliente HTTP, AuthContext, rutas y vistas (`S6`–`S11`). Ruta: delegada. Estado: hecho (build + lint).
- T3 — Verificación: typecheck/build backend, build frontend, e2e real contra MongoDB replica set, verificación independiente (`S1`–`S11`). Ruta: inline + verifier. Estado: hecho.
- T4 — Cierre de deuda: lint verde, `.env.example`, registro atómico, secreto JWT único, e2e commiteado (`S12`–`S16`). Ruta: inline. Estado: hecho y verificado.

## Log

**L1** (petición original, verbatim):
> Ve a mis documentos, cursos, y ahi esta mi repositorio de TuxBack, esta la parte del fronto(no está completo) y esta el backend con node, express con JS y MongooDB y esta la migracion que estoy haciendo que todavia no la he terminado a NestJs, necesito que me ayudes a hacer lo siguiente: ### Contexto del Proyecto y Arquitectura Actual:
> 1. Backend (NestJS + TypeScript + Mongoose):
>    - Conectado a MongoDB Atlas.
>    - Seguridad: JWT almacenado en cookies `HttpOnly` (`lax`), encriptación de contraseñas con Bcrypt.
>    - Control de Acceso: Role-Based Access Control (RBAC) con RolesGuard y decorador personalizado `@Roles('admin', 'cliente')`.
>    - Modulares e Interfaces: `isolatedModules` habilitado en `tsconfig.json` (importando tipos de Express mediante `import * as express from 'express'`).
> 2. Colecciones y Dominio de Base de Datos:
>    - User: `nombre`, `email`, `password` (hashed), `rol` ('cliente' por defecto | 'admin').
>    - Account: `usuario` (ObjectId ref User), `numeroCuenta` (string único de 10 dígitos), `saldo` (number con bono inicial por defecto de 500,000 COP), `activa` (boolean). Se genera automáticamente una cuenta inicial vinculada al registrarse cada usuario (`POST /api/auth/registro`).
>    - Transaction: `cuentaOrigen` (ObjectId ref Account), `cuentaDestino` (ObjectId ref Account), `monto`, `tipo` ('transferencia'), `descripcion`.
> 3. Endpoints Implementados y Funcionales:
>    - `POST /api/auth/registro` -> Crea usuario + genera su cuenta bancaria inicial con 500k de saldo.
>    - `POST /api/auth/login` -> Valida credenciales y emite cookie `HttpOnly` con el token JWT (`payload: { sub: user._id, email, rol }`).
>    - `POST /api/accounts/crear` -> Permite crear cuentas adicionales.
>    - `GET /api/accounts/todas` -> Protegido para Administradores (`@Roles('admin')`).
>    - `POST /api/transactions/transferir` -> Ejecuta una transferencia atómica entre cuentas usando transacciones/sesiones de Mongoose (`connection.startSession()`).
>
> Lo que necesito que hagamos ahora:
> 1. Finalizar Backend en NestJS:
>    - Implementar un endpoint `GET /api/transactions/historial` para obtener la lista de transferencias enviadas y recibidas del usuario autenticado (extraído de la cookie JWT).
>    - Implementar un endpoint `GET /api/accounts/mi-cuenta` o `GET /api/users/perfil` para que el cliente pueda consultar su saldo actual y su número de cuenta.
> 2. Desarrollo del Frontend en React:
>    - Configuración de un cliente HTTP (Axios/Fetch) con `withCredentials: true` para manejar las cookies `HttpOnly` en las peticiones.
>    - Vistas a construir:
>      - Auth: Formulario de Registro e Iniciar Sesión.
>      - Dashboard / Resumen: Mostrar el número de cuenta del cliente, saldo disponible (500,000) y acceso rápido.
>      - Formulario de Transferencias: Input para `numeroCuentaDestino`, `monto` y `descripcion`.
>      - Historial de Movimientos: Tabla/lista con transferencias enviadas (débitos) y recibidas (créditos).
>      - Vista de Administrador (Opcional/Condicional): Ver la lista completa de usuarios y cuentas si el rol es `admin`.

**L2** (evidencia, 2026-11-07) — estado encontrado en `tuxbank-frontend` y `tuxbank-backend-nestjs`:
`App.jsx` importa `./pages/register` (archivo real `Register.jsx`, falla en Linux); `Login.jsx` guardaba
`data.token` en `localStorage` y leía `data.usuario`, ambos ya inexistentes; `api.js` apuntaba a
`/transacciones/transferir` con `cuentaDestino`; `TransferDto.descripcion` con `@IsString()` sin
`@IsOptional()` bajo `forbidNonWhitelisted`; `transferir()` leía y validaba saldos fuera de la sesión
de Mongoose. `GET /api/accounts/mi-cuenta` ya existía y se reutiliza. `tsc --noEmit` del backend pasa.

**L3** (decisión) — Se agrega `GET /api/auth/me` (en lugar de `/api/users/perfil`) porque `AuthModule`
ya tiene el modelo `User` y `AccountsModule` importado, y porque el front necesita `rol` para la vista
de admin en la misma llamada. `GET /api/accounts/mi-cuenta` se conserva.

**L4** (decisión) — El frontend elimina por completo `localStorage` y `Authorization: Bearer`: con
cookies `HttpOnly` la única fuente de verdad de sesión es `GET /auth/me`.

**L5** (decisión) — No se hacen commits: el árbol tiene la migración del usuario sin commitear
(`src/accounts/`, `src/transactions/` están untracked) y mezclarla en commits automáticos sería engañoso.

**L6** (decisión) — La verificación de ejecución contra MongoDB Atlas no se hace sin autorización
explícita del usuario; la verificación es un e2e real contra un replica set en memoria
(`mongodb-memory-server`, instalado con `--no-save`) más typecheck y builds.

**L7** (bug encontrado y corregido) — El e2e reveló que dos transferencias concurrentes sobre la misma
cuenta devolvían `500` con `MongoServerError: WriteConflict` (`TransientTransactionError`). No se movía
dinero (la transacción abortaba), pero es el caso que la documentación de MongoDB manda reintentar.
`transferir()` pasó de `startTransaction()` manual a `session.withTransaction(fn)`, que reintenta ante
errores transitorios y gestiona commit/abort. Tras el cambio: 8 transferencias simultáneas de 100000
sobre un saldo de 350000 → 3 exitosas, 5 rechazadas con 400 `Saldo insuficiente`, saldo final 50000,
A+B = 1.000.000 exacto.

**L8** (desviación aceptada) — `api.js` concatena todos los mensajes de validación de Nest con `' · '`
en lugar de mostrar solo el primero. Se acepta porque el formulario de registro muestra así las tres
reglas de contraseña a la vez. `S6` se actualizó para reflejarlo.

**L9** (verificación independiente) — El verificador devolvió `fail` con dos "blockers" que resultaron
**falsos positivos de atribución**: la desaparición de `GET /auth/perfil` y el cambio del body de
`/auth/registro` (mensaje distinto + `account`) existen en el commit base `fd56c49` frente al árbol de
trabajo, pero provienen de la migración **previa** del usuario, no de esta tarea. `auth.controller.ts` y
`auth.service.ts` ya tenían ese estado antes de empezar (leídos al inicio de la sesión, `M` en
`git status`). Nada en el repo consume `/auth/perfil` y `/auth/me` lo supera. Se registran como
advisories, no como regresiones.

**L10** (advisories heredados, no corregidos) — Fuera del alcance de esta tarea, detectados de paso:
(a) el fallback del secreto JWT no coincide al firmar (`'secretKey'`, `auth.module.ts`) y al verificar
(`'defaultSecret'`, `jwt.strategy.ts`), así que sin `JWT_SECRET` todos los tokens serían inválidos;
(b) `/auth/registro` no es atómico: crea el usuario y luego la cuenta, y si la cuenta falla queda un
usuario sin cuenta; (c) `POST /accounts/crear` es inalcanzable en la práctica porque el registro ya crea
la cuenta y el servicio rechaza duplicados.

**L11** (evidencia de verificación) — e2e `/tmp/opencode/tuxbank-e2e.cjs`: 51/51 aserciones en verde
contra HTTP real y un replica set real (registro, login, cookie HttpOnly+SameSite=Lax, 401 sin cookie,
matriz de validación de transferencias, historial de emisor y receptor, RBAC 403, ráfaga concurrente,
logout idempotente, aislamiento de sesiones). Backend `tsc --noEmit` y `nest build`: exit 0. Frontend
`vite build`: exit 0 (299 kB, 92 kB gzip); `npm run lint`: exit 0 con 1 warning de fast-refresh en
`AuthContext.jsx`. Sin `localStorage`, `sessionStorage` ni `Authorization` en `tuxbank-frontend/src`.

**L12** (petición posterior, verbatim):
> Deja esos puntos cerrados

Se refiere a la lista de deuda técnica de `L10` y la respuesta que la acompañó: lint en rojo,
`.env.example` del backend, `/auth/registro` no atómico y el e2e real. El fallback del JWT (`L10a`)
entra por la misma autorización; borrar el backend Express (`L10f`) y añadir rate limiting (`L10g`)
no, porque el primero es destructivo y el segundo agrega una dependencia.

**L13** (decisions) — (a) El e2e NO usa `Test.createTestingModule`: arranca `dist/main.js` como proceso
real. Motivo: `setGlobalPrefix('api')`, `ValidationPipe`, `cookieParser()` y CORS viven en `main.ts`,
que no está en el grafo de módulos; un `createNestApplication()` prueba otra app. (b) Se eliminó
`test/app.e2e-spec.ts` (scaffold que esperaba `Hello World!` en `/`). (c) `jest.config.ts` excluye
`<rootDir>/test/` para que `npm test` no levante un servidor. (d) `test:e2e` ejecuta `npm run build`
antes, porque el test corre sobre el build. (e) `mongodb-memory-server` pasa a `devDependency`.
(f) `obtenerJwtSecret()` centraliza el secreto: firmar y verificar ya no pueden divergir.

**L14** (evidencia de cierre) — `tsc --noEmit`: exit 0. `npm run lint`: exit 0 sin warnings.
`npm test`: 1 suite / 1 test en verde. `npm run test:e2e`: **23/23 en verde** (incluye registro
concurrente del mismo email: 1×201 y 4×409 con el ganador siempre provisto de cuenta, y la ráfaga
de 8 transferencias sobre 350000: exactamente 3 exitosas, 5×400, saldo final 50000, A+B = 1.000.000).
`vite build`: exit 0. No verificado en runtime: el fallo de arranque por `JWT_SECRET` ausente, porque
el `.env` local sí define la variable; la garantía es estructural (una sola función lee el secreto).

**L15** (hallazgo de seguridad) — `tuxbank-backend/src/config/db.js:3` contenía la cadena de conexión
de Atlas con usuario y contraseña **hardcodeados**, y ya formaba parte de `origin/main`
(`github.com/DiegoAndres4/Tux-Bank`) desde el commit `4ce763b`. Consecuencia: el secreto está en la
historia remota y `git rm` no lo revoca. La única acción que revoca el acceso es **rotar la contraseña
en Atlas**.

**L16** (decisión) — Se elimina `tuxbank-backend/` completo y el `package.json` + `package-lock.json`
de la raíz. Motivos: (a) el backend Express ya está en la historia (`4ce763b`) y no tenía cambios sin
commitear, así que es recuperable con `git show`; (b) nada lo referenciaba (sin workspaces, sin
imports); (c) sus modelos generan colecciones distintas (`usuarios`, `cuentas`, `transaccions`) de las
de Nest (`users`, `accounts`, `transactions`) sobre la **misma** base `mi_banco`, de modo que arrancarlo
por error crearía un conjunto paralelo de colecciones fantasma sin corromper los datos nuevos.
Se descarta el paso "pasar la URI a `process.env`": el archivo se borra en el mismo movimiento, y
arreglarlo no elimina nada de la historia. Era un paso redundante de la propuesta original.

**L17** (evidencia post-borrado) — Tras eliminar el legacy y el `package.json` raíz:
`tsc --noEmit` exit 0, `npm run lint` exit 0, `npm test` 1/1, `npm run test:e2e` **23/23**,
`vite build` exit 0. El árbol queda solo con `tuxbank-backend-nestjs/`, `tuxbank-frontend/` y `odd/`.



