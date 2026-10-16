import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
 import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { OtpService } from '../auth/otp.service';
import { AddUserTokenDto } from './dto/create-user-token.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Audit } from '../audit/audit.decorator';
import { DeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard) 
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private readonly otpService: OtpService
  ) { }

  /* ================= Add Notification Token ================= */
  @Post('add-token')
  @ApiOperation({ summary: 'Add notification token for logged-in user' })
  @ApiBody({ type: AddUserTokenDto })
  async addToken(@Req() req: express.Request, @Body() body: AddUserTokenDto) {
    const userId = (req.user as any).userId; 
    return this.userService.addNotificationToken(userId, body.token);
  }

  @Post('me/delete/request-otp')
@Audit('User requested delete account OTP')
@ApiOperation({ summary: 'Request OTP to delete my account' })
async requestDeleteAccountOtp(@Req() req: any) {
  return this.userService.requestDeleteAccountOtp(req.user.userId);
}

@Post('me/delete')
@Audit('User delete his profile')
@ApiOperation({ summary: 'Soft delete my customer account with OTP confirmation' })
async softDeleteMyAccount(
  @Req() req: any,
  @Body() dto: DeleteAccountDto,
  @Res({ passthrough: true }) res: Response,
) {
  const result = await this.userService.deleteUserAccount(
    req.user.userId,
    dto.code,
    dto.reason,
  );

  res.clearCookie('refreshToken', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return result;
}

 

@Patch('profile-provider')
  @ApiOperation({ summary: 'Update user(provider) profile (name, email, phone)' })
  @ApiBody({ type: UpdateUserProfileDto })
  async updateProfile(@Req() req, @Body() dto: UpdateUserProfileDto) {
    const userId =req.user.sub;
    
    // // Handle phone OTP validation
    // if (dto.phone && dto.code) {
    //   await this.otpService.validateOtp(dto.phone, dto.code);
    // }

    return this.userService.updateProfile(userId, dto);
  }

  @Get('profile-provider')
@ApiOperation({ summary: 'Fetch user (Provider) data' })
async getProfile(@Req() req: express.Request) {
  const userId = (req.user as any).sub;
  return this.userService.getProfile(userId);
}
}
