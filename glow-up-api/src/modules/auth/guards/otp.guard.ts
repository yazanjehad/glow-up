import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class OtpGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) throw new UnauthorizedException();

    const payload = this.jwtService.verify(token);

    if (payload.type !== 'OTP_VERIFIED') {
      throw new UnauthorizedException('Invalid OTP token');
    }
 
    req.phone = payload.phone;
    return true;
  }
}
