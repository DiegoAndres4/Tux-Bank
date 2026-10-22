import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar cookie-parser para leer req.cookies de las peticiones
  app.use(cookieParser());

  // Habilitar el pipeline de validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Filtra y elimina propiedades no definidas en los DTOs
      forbidNonWhitelisted: true, // Devuelve error si envían campos no permitidos
      transform: true, // Convierte tipos automáticamente (ej. string a number)
    }),
  );

  // Prefijo global para todas las rutas HTTP (ej: http://localhost:3000/api/...)
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Servidor TuxBank (NestJS) corriendo en: http://localhost:${port}/api`);
}
bootstrap();