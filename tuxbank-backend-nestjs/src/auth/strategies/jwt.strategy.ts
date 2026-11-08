import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { obtenerJwtSecret } from '../jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extraer el JWT desde la cookie 'token'
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['token'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: obtenerJwtSecret(configService),
    });
  }

  // Se ejecuta si el token es válido
  async validate(payload: { sub: string; email: string; rol: string }) {
    if (!payload) {
      throw new UnauthorizedException('Token no válido o expirado');
    }
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}