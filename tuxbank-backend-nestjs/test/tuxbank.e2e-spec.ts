import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * E2E real de Tux Bank.
 *
 * A diferencia del scaffold que genera `nest new`, este test NO usa
 * `Test.createTestingModule`. Levanta el `dist/main.js` compilado tal cual, sobre
 * un MongoDB en memoria configurado como replica set, y habla HTTP de verdad.
 *
 * ¿Por qué arrancar el proceso real? Porque el prefijo global `api`, el
 * `ValidationPipe`, `cookieParser()` y CORS viven en `main.ts`, que no forma
 * parte del grafo de módulos. Un test con `createNestApplication()` prueba una
 * aplicación distinta de la que corre en producción.
 *
 * Las transacciones de MongoDB exigen un replica set; por eso se usa
 * `MongoMemoryReplSet` y no un `mongod` suelto.
 */

jest.setTimeout(240_000);

const PUERTO = 3999;
const BASE = `http://127.0.0.1:${PUERTO}/api`;
const RAIZ_PROYECTO = path.resolve(__dirname, '..');

type Cuerpo = any;

interface Respuesta {
  status: number;
  data: Cuerpo;
  setCookies: string[];
}

/**
 * Cliente HTTP con cookie jar propio: simula un navegador. La sesión viaja
 * exclusivamente en la cookie `token` (HttpOnly), igual que en el frontend.
 */
class Cliente {
  private cookies = new Map<string, string>();

  tieneCookie(nombre: string): boolean {
    return this.cookies.has(nombre);
  }

  async pedir(
    metodo: 'GET' | 'POST',
    ruta: string,
    cuerpo?: Cuerpo,
  ): Promise<Respuesta> {
    const headers: Record<string, string> = {};

    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies.entries()]
        .map(([nombre, valor]) => `${nombre}=${valor}`)
        .join('; ');
    }
    if (cuerpo !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const opciones: RequestInit =
      cuerpo === undefined
        ? { method: metodo, headers }
        : { method: metodo, headers, body: JSON.stringify(cuerpo) };

    const respuesta = await fetch(`${BASE}${ruta}`, opciones);

    const setCookies =
      (
        respuesta.headers as Headers & { getSetCookie?: () => string[] }
      ).getSetCookie?.() ?? [];

    for (const crudo of setCookies) {
      const [pareja] = crudo.split(';');
      const indice = pareja.indexOf('=');
      const nombre = pareja.slice(0, indice).trim();
      const valor = pareja.slice(indice + 1).trim();
      const expirada = /Expires=Thu, 01 Jan 1970/i.test(crudo) || valor === '';

      if (expirada) {
        this.cookies.delete(nombre);
      } else {
        this.cookies.set(nombre, valor);
      }
    }

    const texto = await respuesta.text();
    let data: Cuerpo = null;
    try {
      data = texto ? JSON.parse(texto) : null;
    } catch {
      data = texto;
    }

    return { status: respuesta.status, data, setCookies };
  }
}

const anonimo = new Cliente();

async function esperarServidor(timeoutMs = 60_000): Promise<void> {
  const inicio = Date.now();

  while (Date.now() - inicio < timeoutMs) {
    try {
      const respuesta = await fetch(`${BASE}/auth/me`);
      if (respuesta.status) return;
    } catch {
      // Todavía no escucha.
    }
    await new Promise((resolver) => setTimeout(resolver, 300));
  }

  throw new Error(
    `El servidor no respondió en ${BASE} después de ${timeoutMs}ms`,
  );
}

let mongo: MongoMemoryReplSet;
let servidor: ChildProcess;

beforeAll(async () => {
  const entrada = path.join(RAIZ_PROYECTO, 'dist', 'main.js');

  if (!existsSync(entrada)) {
    throw new Error(
      'No existe dist/main.js. Este test corre sobre el build: `npm run build` primero (o usa `npm run test:e2e`).',
    );
  }

  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  servidor = spawn(process.execPath, [entrada], {
    cwd: RAIZ_PROYECTO,
    env: {
      ...process.env,
      MONGODB_URI: mongo.getUri('tuxbank_e2e'),
      JWT_SECRET: 'secreto-solo-para-el-e2e',
      PORT: String(PUERTO),
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  servidor.stdout?.resume();
  servidor.stderr?.resume();

  await esperarServidor();
});

afterAll(async () => {
  servidor?.kill('SIGKILL');
  await mongo?.stop();
});

describe('Autenticación', () => {
  let numeroCuentaA = '';
  let numeroCuentaB = '';

  it('registra un usuario y le crea su cuenta con el bono inicial', async () => {
    const respuesta = await anonimo.pedir('POST', '/auth/registro', {
      nombre: 'Diego A',
      email: 'a@tux.test',
      password: 'Password1@',
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.data.account.numeroCuenta).toMatch(/^\d{10}$/);
    expect(respuesta.data.account.saldo).toBe(500000);

    numeroCuentaA = respuesta.data.account.numeroCuenta;
  });

  it('registra un segundo usuario', async () => {
    const respuesta = await anonimo.pedir('POST', '/auth/registro', {
      nombre: 'Ana B',
      email: 'b@tux.test',
      password: 'Password1@',
    });

    expect(respuesta.status).toBe(201);
    numeroCuentaB = respuesta.data.account.numeroCuenta;
    expect(numeroCuentaB).not.toBe(numeroCuentaA);
  });

  it('rechaza un email repetido con 409', async () => {
    const respuesta = await anonimo.pedir('POST', '/auth/registro', {
      nombre: 'Duplicado',
      email: 'a@tux.test',
      password: 'Password1@',
    });

    expect(respuesta.status).toBe(409);
  });

  it('rechaza una contraseña que no cumple la política', async () => {
    const respuesta = await anonimo.pedir('POST', '/auth/registro', {
      nombre: 'Sin Mayúscula',
      email: 'sin@tux.test',
      password: 'password1@',
    });

    expect(respuesta.status).toBe(400);
  });

  it('no expone el token en el body y lo guarda en una cookie HttpOnly', async () => {
    const login = await new Cliente().pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    expect(login.status).toBe(200);
    expect(login.data).not.toHaveProperty('token');

    const cookie = login.setCookies.join(' ');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rechaza credenciales inválidas con 401', async () => {
    const respuesta = await anonimo.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'incorrecta',
    });

    expect(respuesta.status).toBe(401);
  });

  it('protege todas las rutas privadas sin cookie', async () => {
    for (const ruta of [
      '/auth/me',
      '/accounts/mi-cuenta',
      '/accounts/todas',
      '/transactions/historial',
    ]) {
      const respuesta = await anonimo.pedir('GET', ruta);
      expect(respuesta.status).toBe(401);
    }
  });

  it('expone el usuario y su cuenta en /auth/me', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    const respuesta = await cliente.pedir('GET', '/auth/me');

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.user.rol).toBe('cliente');
    expect(respuesta.data.account.numeroCuenta).toBe(numeroCuentaA);
    expect(respuesta.data.account.saldo).toBe(500000);
  });

  it('devuelve el saldo por /accounts/mi-cuenta', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    const respuesta = await cliente.pedir('GET', '/accounts/mi-cuenta');

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.saldo).toBe(500000);
  });

  it('prohíbe /accounts/todas a un cliente', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    const respuesta = await cliente.pedir('GET', '/accounts/todas');
    expect(respuesta.status).toBe(403);
  });

  it('registro concurrente del mismo email: uno gana (201) y el resto recibe 409', async () => {
    const intentos = await Promise.all(
      Array.from({ length: 5 }, (_, indice) =>
        anonimo.pedir('POST', '/auth/registro', {
          nombre: `Carrera ${indice}`,
          email: 'carrera@tux.test',
          password: 'Password1@',
        }),
      ),
    );

    const exitos = intentos.filter((r) => r.status === 201);
    const conflictos = intentos.filter((r) => r.status === 409);

    expect(exitos).toHaveLength(1);
    expect(conflictos).toHaveLength(4);

    // El usuario que ganó debe tener cuenta: no puede quedar huérfano.
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'carrera@tux.test',
      password: 'Password1@',
    });
    const perfil = await cliente.pedir('GET', '/auth/me');

    expect(perfil.status).toBe(200);
    expect(perfil.data.account).not.toBeNull();
  });
});

describe('Transferencias', () => {
  let clienteA: Cliente;
  let clienteB: Cliente;
  let cuentaA: string;
  let cuentaB: string;

  beforeAll(async () => {
    clienteA = new Cliente();
    clienteB = new Cliente();

    await clienteA.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });
    await clienteB.pedir('POST', '/auth/login', {
      email: 'b@tux.test',
      password: 'Password1@',
    });

    cuentaA = (await clienteA.pedir('GET', '/accounts/mi-cuenta')).data
      .numeroCuenta;
    cuentaB = (await clienteB.pedir('GET', '/accounts/mi-cuenta')).data
      .numeroCuenta;
  });

  it('rechaza transferirse a sí mismo', async () => {
    const respuesta = await clienteA.pedir(
      'POST',
      '/transactions/transferir',
      { numeroCuentaDestino: cuentaA, monto: 1000 },
    );

    expect(respuesta.status).toBe(400);
    expect(respuesta.data.message).toMatch(/ti mismo/);
  });

  it('rechaza una cuenta destino inexistente', async () => {
    const respuesta = await clienteA.pedir(
      'POST',
      '/transactions/transferir',
      { numeroCuentaDestino: '9999999999', monto: 1000 },
    );

    expect(respuesta.status).toBe(404);
  });

  it('rechaza saldo insuficiente', async () => {
    const respuesta = await clienteA.pedir(
      'POST',
      '/transactions/transferir',
      { numeroCuentaDestino: cuentaB, monto: 999999 },
    );

    expect(respuesta.status).toBe(400);
    expect(respuesta.data.message).toMatch(/insuficiente/);
  });

  it('valida el número de cuenta y el monto con el DTO', async () => {
    const casos = [
      { numeroCuentaDestino: '123', monto: 1000 },
      { numeroCuentaDestino: 'abcdefghij', monto: 1000 },
      { numeroCuentaDestino: cuentaB, monto: 0 },
      { numeroCuentaDestino: cuentaB, monto: -5 },
      { numeroCuentaDestino: cuentaB, monto: 10.5 },
      { numeroCuentaDestino: cuentaB, monto: 1000, campoExtra: true },
    ];

    for (const caso of casos) {
      const respuesta = await clienteA.pedir(
        'POST',
        '/transactions/transferir',
        caso,
      );
      expect(respuesta.status).toBe(400);
    }
  });

  it('transfiere sin descripción (es realmente opcional)', async () => {
    const respuesta = await clienteA.pedir(
      'POST',
      '/transactions/transferir',
      { numeroCuentaDestino: cuentaB, monto: 100000 },
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.comprobante.nuevoSaldo).toBe(400000);
    expect(respuesta.data.comprobante.destino).toBe(cuentaB);
  });

  it('transfiere con descripción', async () => {
    const respuesta = await clienteA.pedir(
      'POST',
      '/transactions/transferir',
      {
        numeroCuentaDestino: cuentaB,
        monto: 50000,
        descripcion: 'Almuerzo',
      },
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.comprobante.nuevoSaldo).toBe(350000);
  });

  it('los rechazos no movieron dinero', async () => {
    const cuentaMovida = (await clienteA.pedir('GET', '/accounts/mi-cuenta'))
      .data.saldo;
    expect(cuentaMovida).toBe(350000);
  });
});

describe('Historial', () => {
  it('devuelve los movimientos enviados desde la perspectiva del emisor', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    const respuesta = await cliente.pedir('GET', '/transactions/historial');

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.movimientos).toHaveLength(2);

    const [masReciente, anterior] = respuesta.data.movimientos;

    expect(masReciente.direccion).toBe('enviada');
    expect(masReciente.descripcion).toBe('Almuerzo');
    expect(masReciente.monto).toBe(50000);
    expect(masReciente.contraparte.nombre).toBe('Ana B');
    expect(masReciente.contraparte.numeroCuenta).toMatch(/^\d{10}$/);
    expect(Number.isNaN(Date.parse(masReciente.fecha))).toBe(false);

    expect(anterior.direccion).toBe('enviada');
    expect(anterior.descripcion).toBe('Transferencia entre cuentas TuxBank');
  });

  it('devuelve los mismos movimientos como recibidos desde el receptor', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'b@tux.test',
      password: 'Password1@',
    });

    const respuesta = await cliente.pedir('GET', '/transactions/historial');

    expect(respuesta.status).toBe(200);
    expect(respuesta.data.movimientos).toHaveLength(2);
    expect(
      respuesta.data.movimientos.every(
        (movimiento: Cuerpo) => movimiento.direccion === 'recibida',
      ),
    ).toBe(true);
    expect(respuesta.data.movimientos[0].contraparte.nombre).toBe('Diego A');

    const saldo = (await cliente.pedir('GET', '/accounts/mi-cuenta')).data
      .saldo;
    expect(saldo).toBe(650000);
  });
});

describe('Atomicidad bajo concurrencia', () => {
  it('una ráfaga de transferencias no crea ni destruye dinero', async () => {
    const clienteA = new Cliente();
    const clienteB = new Cliente();

    await clienteA.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });
    await clienteB.pedir('POST', '/auth/login', {
      email: 'b@tux.test',
      password: 'Password1@',
    });

    const cuentaB = (await clienteB.pedir('GET', '/accounts/mi-cuenta')).data
      .numeroCuenta;
    const saldoInicialA = (await clienteA.pedir('GET', '/accounts/mi-cuenta'))
      .data.saldo;

    // 8 transferencias simultáneas de 100000 sobre un saldo de 350000:
    // solo 3 pueden tener fondos.
    const rafaga = await Promise.all(
      Array.from({ length: 8 }, () =>
        clienteA.pedir('POST', '/transactions/transferir', {
          numeroCuentaDestino: cuentaB,
          monto: 100000,
        }),
      ),
    );

    const exitos = rafaga.filter((r) => r.status === 200).length;
    const rechazos = rafaga.filter((r) => r.status === 400).length;

    expect(exitos).toBe(3);
    expect(rechazos).toBe(5);

    const saldoFinalA = (await clienteA.pedir('GET', '/accounts/mi-cuenta'))
      .data.saldo;
    const saldoFinalB = (await clienteB.pedir('GET', '/accounts/mi-cuenta'))
      .data.saldo;

    expect(saldoFinalA).toBe(50000);
    expect(saldoFinalA).toBeGreaterThanOrEqual(0);
    expect(saldoFinalA + saldoFinalB).toBe(1000000);
    expect(saldoInicialA - saldoFinalA).toBe(exitos * 100000);
  });
});

describe('Logout', () => {
  it('es idempotente y borra la cookie', async () => {
    const cliente = new Cliente();
    await cliente.pedir('POST', '/auth/login', {
      email: 'a@tux.test',
      password: 'Password1@',
    });

    expect((await cliente.pedir('GET', '/auth/me')).status).toBe(200);

    const salida = await cliente.pedir('POST', '/auth/logout');
    expect(salida.status).toBe(200);
    expect(cliente.tieneCookie('token')).toBe(false);

    expect((await cliente.pedir('GET', '/auth/me')).status).toBe(401);
    expect((await cliente.pedir('POST', '/auth/logout')).status).toBe(200);
  });

  it('no afecta a otras sesiones', async () => {
    const otraSesion = new Cliente();
    await otraSesion.pedir('POST', '/auth/login', {
      email: 'b@tux.test',
      password: 'Password1@',
    });

    expect((await otraSesion.pedir('GET', '/auth/me')).status).toBe(200);
  });
});
