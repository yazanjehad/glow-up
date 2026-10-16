import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Otp } from './schemas/otp.schema';
import { Model } from 'mongoose';

@Injectable()
export class OtpService {
  constructor(@InjectModel(Otp.name) private otpModel: Model<Otp>) {}

  async generateOtp(phone: string, type="LOGIN") {
    const existingOtp = await this.otpModel.findOne({ phone });

    if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
      const secondsLeft = Math.ceil(
        (existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000,
      );

      throw new BadRequestException({
        message: 'common.errors.OTP_ALREADY_SENT',
        args: { seconds: secondsLeft },
      });
    }

    // const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code = '1234';
    await this.otpModel.findOneAndUpdate(
      { phone },
      {
        phone,
        code,
        purpose:type,
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        resendAvailableAt: new Date(Date.now() + 30 * 1000), // ✅ 30 seconds
      },
      { upsert: true },
    );

    // TODO: SMS Provider
    console.log('OTP:', code);

    return true;
  }

  async validateOtp(phone: string, code: string, type="LOGIN") {
    const otp = await this.otpModel.findOne({ phone });

    if (!otp || otp.purpose != type) {
      throw new BadRequestException('common.errors.OTP_NOT_FOUND');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('common.errors.OTP_EXPIRED');
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException('common.errors.OTP_TOO_MANY_ATTEMPTS');
    }

    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();

      throw new BadRequestException({
        message: 'common.errors.OTP_INVALID_ATTEMPTS_LEFT',
        args: { left: 5 - otp.attempts },
      });
    }

    // ✅ OTP SUCCESS
    await this.otpModel.deleteOne({ phone });

    return true;
  }
}
