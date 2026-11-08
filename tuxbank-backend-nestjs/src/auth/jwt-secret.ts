import { ConfigService } from '@nestjs/config';

const NOMBRE_VARIABLE = 'JWT_SECRET';

/**
 * Única fuente de verdad del secreto JWT.
 *
 * Antes existían dos fallbacks distintos: `'secretKey'` al firmar y
 * `'defaultSecret'` al verificar. Sin `JWT_SECRET` la aplicación arrancaba igual,
 * pero TODOS los tokens eran inválidos y el síntoma aparecía mucho más tarde,
 * como un 401 imposible de explicar.
 *
 * Mejor fallar al arrancar que firmar tokens que nadie puede verificar.
 */
export function obtenerJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>(NOMBRE_VARIABLE);

  if (!secret) {
    throw new Error(
      `La variable de entorno ${NOMBRE_VARIABLE} es obligatoria: sin ella no se pueden firmar ni verificar los JWT.`,
    );
  }

  return secret;
}
