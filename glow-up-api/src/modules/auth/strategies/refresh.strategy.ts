
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
     super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // for mobile
        (req) => req?.cookies?.refreshToken,
      ]),
      secretOrKey:  config.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
      
    });
  }

 
  async validate(payload: any) {
    return {
      userId: payload.sub,
    };
  }

}
