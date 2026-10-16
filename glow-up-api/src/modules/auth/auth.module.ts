import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CustomerModule } from '../customer/customer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { OtpService } from './otp.service';
import { ProviderService } from '../provider/provider.service';
import { ProviderModule } from '../provider/provider.module';
import { EmployeeModule } from '../employee/employee.module';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
       MongooseModule.forFeature([
          {
            name: Otp.name,
            schema: OtpSchema,
          },
          {
            name:RefreshToken.name,
            schema:RefreshTokenSchema
          }
        ]),

    forwardRef(() => UsersModule),
    CustomerModule,
    ProviderModule,
    EmployeeModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
       useFactory: (config: ConfigService) => ({
    secret: config.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '15m' },
  }),
    }),

  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy,RefreshStrategy,OtpService],
  exports: [AuthService, JwtModule, OtpService],
})
export class AuthModule {}
