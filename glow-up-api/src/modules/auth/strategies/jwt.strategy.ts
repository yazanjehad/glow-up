import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') || 'dev_secret',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      sub: payload.sub,
      role: payload.role,
      permissions: payload.permissions ?? [],
      capabilities:payload.capabilities ?? [],
      providerId: payload.providerId,
    };
  }

}
