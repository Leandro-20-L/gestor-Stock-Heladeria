import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// 1. Definimos una interfaz para que TypeScript sepa qué tiene el payload
interface Payload {
  sub: string;
  username: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      // LEEMOS LA MISMA VARIABLE DEL .ENV
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: Payload) {
    return {
      userId: payload.sub,
      username: payload.username,
      rol: payload.rol,
    };
  }
}
