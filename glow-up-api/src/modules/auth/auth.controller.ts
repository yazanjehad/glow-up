import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBadRequestResponse, ApiOkResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpGuard } from './guards/otp.guard';
import { LoginVerifyOtpDto } from './dto/login-verify-otp';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { Response } from 'express';

@ApiHeader({
  name: 'Accept-Language',
  description: 'Language (ar | en)',
  required: false,
  schema: {
    type: 'string',
    default: 'ar',
    enum: ['ar', 'en'],
  },
})
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /* ================= Customer Registration ================= */
   
  @Post('otp/request')
  @ApiOperation({
    summary: 'Request OTP for customer signup',
    description: 'Send OTP to customer mobile number (once every 30 seconds)',
  })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    schema: {
      example: {
        success: true,
        message: 'OTP sent successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid phone number or OTP already sent',
  })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }


  @Post('customer/verify-otp')
  @ApiTags('Auth')
  @ApiOperation({
    summary: 'Verify OTP and decide next action',
    description: `
Verifies OTP and determines next step:
- LOGIN → User + Customer Profile exists
- COMPLETE_PROFILE → User exists, no customer profile
- CREATE_ACCOUNT → No user exists
`,
  })

  @ApiOkResponse({
    description: 'OTP verified – user logged in directly',
    schema: {
      example: {
        nextAction: 'LOGIN',
        accessToken: 'jwt_access_token_here',
        user: {
          id: '65fa123',
          role: 'CUSTOMER',
          permissions: [],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP verified – user exists, needs to complete customer profile',
    schema: {
      example: {
        nextAction: 'COMPLETE_PROFILE',
        otpToken: 'temporary_otp_token_here',
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP verified – new user, needs to create account',
    schema: {
      example: {
        nextAction: 'CREATE_ACCOUNT',
        otpToken: 'temporary_otp_token_here',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP / Expired OTP / Too many attempts',
    schema: {
      example: {
        message: 'Invalid OTP',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async verifyUserOtp(@Body() dto: VerifyOtpDto, @Req() req, @Res({ passthrough: true }) res: Response,) {
    const result =
      await this.authService.verifyUserOtp(dto);

    if (result.nextAction === 'LOGIN') {

      this.setRefreshCookie(res, result.refreshToken);
      if (this.isMobile(req)) {
        return {
          nextAction: result.nextAction,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        };
      }

      // Web response
      return {
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        user: result.user,
      };


    }
    return result;



  }

  @UseGuards(OtpGuard)
  @ApiBearerAuth('otp-token')
  @Post('customer/create-profile')
  async completeProfile(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterCustomerDto,
  ) {
    const result = await this.authService.createCustomerProfile(
      req.phone,
      dto,
    );

    this.setRefreshCookie(res, result.refreshToken);

    // Mobile: return refreshToken in body
    if (this.isMobile(req)) {
      return {

        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }

    // Web response
    return {

      accessToken: result.accessToken,
      user: result.user,
    };


  }



  /* ================= Provider Registration (Step 1) ================= */
  @Post('provider/verify-otp')
  @ApiTags('Auth')
  @ApiOperation({
    summary: 'Verify OTP and decide next action',
    description: `
Verifies OTP and determines next step:
- LOGIN → User + Customer Profile exists
- COMPLETE_PROFILE → User exists, no provider profile
- CREATE_ACCOUNT → No user exists
`,
  })

  @ApiOkResponse({
    description: 'OTP verified – user logged in directly',
    schema: {
      example: {
        nextAction: 'LOGIN',
        accessToken: 'jwt_access_token_here',
        user: {
          id: '65fa123',
          role: 'PROVIDER',
          permissions: [],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP verified – user exists, needs to complete customer profile',
    schema: {
      example: {
        nextAction: 'COMPLETE_PROFILE',
        otpToken: 'temporary_otp_token_here',
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP verified – new user, needs to create account',
    schema: {
      example: {
        nextAction: 'CREATE_ACCOUNT',
        otpToken: 'temporary_otp_token_here',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP / Expired OTP / Too many attempts',
    schema: {
      example: {
        message: 'Invalid OTP',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async verifProviderOtp(@Body() dto: VerifyOtpDto, @Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyProviderOtp(dto);


    if (result.nextAction === 'LOGIN') {
      // Web: cookie
      this.setRefreshCookie(res, result.refreshToken);

      // Mobile: return refreshToken in body
      if (this.isMobile(req)) {
        return {
          nextAction: result.nextAction,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        };
      }

      // Web response
      return {
        nextAction: result.nextAction,
        accessToken: result.accessToken,
        user: result.user,
      };

    }
    return result;


  }

  @Post('provider/create-profile')
  @UseGuards(OtpGuard)
  @ApiBearerAuth('otp-token')
  @ApiOperation({ summary: 'Register as service provider (step 1)' })
  async registerProvider(@Req() req, @Res({ passthrough: true }) res: Response, @Body() dto: RegisterProviderDto) {
    const result = await this.authService.createProviderProfile(req.phone, dto);
    // Web: cookie
    this.setRefreshCookie(res, result.refreshToken);

    // Mobile: return refreshToken in body
    if (this.isMobile(req)) {
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }

    // Web response
    return {
      accessToken: result.accessToken,
      user: result.user,
    };

  }

  /* ================= Login ================= */

  @Post('login/otp')
  @ApiOperation({ summary: 'Login user via otp using to non-customer users' })
  async loginOtp(
    @Req() req,
    @Body() dto: LoginVerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {

    const result = await this.authService.loginWithOtp(dto);

    // Web: cookie
    this.setRefreshCookie(res, result.refreshToken);

    // Mobile: return refreshToken in body
    if (this.isMobile(req)) {
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }

    // Web response
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login/password')
  @ApiOperation({ summary: 'Login user via password' })
  async login(
    @Req() req,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {

    const result = await this.authService.loginWithPassword(dto);

    // Web: cookie
    this.setRefreshCookie(res, result.refreshToken);

    // Mobile: return refreshToken in body
    if (this.isMobile(req)) {
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    }
    // Web response
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {

    const oldToken =
      req.headers.authorization?.split(' ')[1] ||
      req.cookies.refreshToken;


    const tokens =
      await this.authService.rotateRefreshToken(
        oldToken,
        req.user.userId,
      );

    this.setRefreshCookie(res, tokens.refreshToken);

    const isMobile = req.headers['x-platform'] === 'mobile';

    return isMobile
      ? { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
      : { accessToken: tokens.accessToken };

  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const oldToken =
      req.headers.authorization?.split(' ')[1] ||
      req.cookies?.refreshToken;

    if (oldToken) {
      await this.authService.logout(oldToken);
    }

    res.clearCookie('refreshToken', {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { message: 'Logged out' };
  }

  private setRefreshCookie(res: Response, refreshToken?: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private isMobile(req: any): boolean {
    return String(req.headers['x-platform'] ?? '').toLowerCase() === 'mobile';
  }
}
