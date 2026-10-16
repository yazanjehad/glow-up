import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { LoginDto } from './dto/login.dto';
import { RoleType } from 'src/common/enum/roletype.enum';
import { User } from '../users/schemas/user.schema';
import { Employee } from '../employee/schemas/employee.schema';
import { CustomerService } from '../customer/customer.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { LoginVerifyOtpDto } from './dto/login-verify-otp';
import { ProviderService } from '../provider/provider.service';
import { CreateServiceProviderDto } from '../provider/dto/create-service-provider.dto';
import { EmployeeService } from '../employee/employee.service';
import { ClientSession, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly customerService: CustomerService,
    private readonly providerService: ProviderService,
    private readonly employeeService: EmployeeService,
    private readonly otpService: OtpService,
     private readonly config: ConfigService,
     @InjectModel(RefreshToken.name)
    private refreshModel: Model<RefreshToken>,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    await this.otpService.generateOtp(dto.phone);

    return {
      message: 'common.success.OTP_SENT',
    };
  }

  async verifyUserOtp(dto: VerifyOtpDto) {
    await this.otpService.validateOtp(dto.phone, dto.code);

    const user = await this.usersService.findByPhone(dto.phone);

    // 🟢 User + Customer Profile → Login
    if (user) {
      const profile = await this.customerService.findByUserId(user._id);

       // 🟢 LOGIN CASE
    if (profile) {

      const payload = this.buildUserPayload(user);

      const tokens =
        await this.generateTokens(payload);

      return {
        nextAction: 'LOGIN',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
        },
      };
    }

      // 🟡 User and no Customer Profile
      const otpToken = this.jwtService.sign(
        {
          sub: user._id,
          phone: dto.phone,
          type: 'OTP_VERIFIED',
        },
        { expiresIn: '10m' },
      );

      return {
        nextAction: 'COMPLETE_PROFILE',
        otpToken,
      };
    }

    // no User
    const otpToken = this.jwtService.sign(
      {
        phone: dto.phone,
        type: 'OTP_VERIFIED',
      },
      { expiresIn: '10m' },
    );

    return {
      nextAction: 'CREATE_ACCOUNT',
      otpToken,
    };
  }

  //refreash token

   async generateTokens(payload: any) {

  const accessToken = this.jwtService.sign(
    payload,
    {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    },
  );

  const refreshToken = this.jwtService.sign(
    { sub: payload.sub },
    {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    },
  );

  await this.refreshModel.create({
    userId: payload.sub,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
}



 async rotateRefreshToken(oldToken: string, userId: string) {

  const stored = await this.refreshModel.findOne({
    userId: new Types.ObjectId(userId),
    token: oldToken,
    revoked: false,
    expiresAt: { $gt: new Date() },  // check expiration
    
  });

    if (!stored) {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }
  

  stored.revoked = true;
  await stored.save();

 
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new UnauthorizedException();
  }

  const payload = this.buildUserPayload(user);

  return this.generateTokens(payload);
}


  async logout(refreshToken: string) {
    await this.refreshModel.updateOne(
      { token: refreshToken },
      { revoked: true },
    );
  }

  async createCustomerProfile(phone: string, dto: RegisterCustomerDto) {
    const session = await this.usersService.startSession();
    session.startTransaction();

    try {
      let user = await this.usersService.findByPhone(phone);

     // Admins not allowed via signup flow
      if (
        user &&
        (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN)
      ) {
        throw new BadRequestException('common.errors.ADMIN_SIGNUP_NOT_ALLOWED');
      }

      // Create user if not exists
      if (!user) {
        user = await this.usersService.createUser({
            phone,
            name: `${dto.firstname} ${dto.lastname}`,
            email: dto.email,
            password: dto.password,
            role: RoleType.CUSTOMER,
          },
          session,
        );
      }

    // Check existing customer profile
      const existingProfile = await this.customerService.findByUserId(
        user._id.toString(),
      );

      if (existingProfile) {
        throw new BadRequestException(
          'common.errors.CUSTOMER_PROFILE_ALREADY_EXISTS',
        );
      }

      // Create customer profile
      await this.customerService.createProfile(
        {
          userId: user._id,
          firstname: dto.firstname,
          lastname: dto.lastname,
          gender: dto.gender,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        },
        session,
      );

      await session.commitTransaction();
      session.endSession();
    // 🔑 Return JWT
    const payload = this.buildUserPayload(user);
        const tokens = await this.generateTokens(payload);

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user._id,
            name: user.name,
            role: user.role,
          },
        };

     
    

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // =========================
  // Register Provider
  // =========================

  async verifyProviderOtp(dto: VerifyOtpDto) {
    await this.otpService.validateOtp(dto.phone, dto.code);

    const user = await this.usersService.findByPhone(dto.phone);
      // no User
  if (!user) {
    const otpToken = this.jwtService.sign(
      {
        phone: dto.phone,
        type: 'OTP_VERIFIED',
      },
      { expiresIn: '10m' },
    );

    return {
      nextAction: 'CREATE_ACCOUNT',
      otpToken,
    };
  }
      // only PROVIDER or EMPLOYEE allowed here
      if (user.role !== RoleType.PROVIDER && user.role !== RoleType.EMPLOYEE) {
        throw new UnauthorizedException('common.errors.user_is_not_a_provider_or_employee');
      }

       // EMPLOYEE → login directly
  if (user.role === RoleType.EMPLOYEE) {
    var employee = await this.employeeService.findByUserId(user._id);

    if (!employee?.capabilities?.canLogin) {
      throw new UnauthorizedException('common.errors.EMPLOYEE_CANT_LOGIN');
    }
    const payload = this.buildUserPayload(user,employee);
    const tokens = await this.generateTokens(payload);

    return {
      nextAction: 'LOGIN',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        permissions: payload.permissions ?? [],
      capabilities: payload.capabilities ?? [],
      },
    };
  }
      const profile = await this.providerService.findByUserId(
        user._id.toString(),
      );

      // 🟢 LOGIN CASE
    if (profile) {

      const payload =
        this.buildUserPayload(user);

      const tokens =
        await this.generateTokens(payload);

      return {
        nextAction: 'LOGIN',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
        },
      };
    }

      // 🟡 User and no Provider Profile
      const otpToken = this.jwtService.sign(
        {
          sub: user._id,
          phone: dto.phone,
          type: 'OTP_VERIFIED',
        },
        { expiresIn: '10m' },
      );

      return {
        nextAction: 'COMPLETE_PROFILE',
        otpToken,
      };
    

   
  }

  async createProviderProfile(phone: string, dto: RegisterProviderDto) {
    const session = await this.usersService.getModel().db.startSession();
    session.startTransaction();

    try {
      let user = await this.usersService.findByPhone(phone);

      // Admins not allowed
      if (
        user &&(user.role != RoleType.PROVIDER )
      ) {
        throw new BadRequestException('common.errors.ADMIN_PROVIDER_NOT_ALLOWED');
      }

      // 🟢 Create new user if not exists
      if (!user) {
        user = await this.usersService.createUser({
          phone,
          name: dto.name,
          email: dto.email,
          password: dto.password,
          role: RoleType.PROVIDER,
        }, session);
      }

      // Upgrade CUSTOMER → PROVIDER
      // if (user.role === RoleType.CUSTOMER) {
      //   await this.usersService.updateRole(
      //     user._id.toString(),
      //     RoleType.PROVIDER,
      //     session
      //   );
      //   user.role = RoleType.PROVIDER;
      // }

      // Check existing provider profile
      const existingProfile = await this.providerService.findByUserId(
        user._id.toString(),
      );

      if (existingProfile) {
        throw new BadRequestException(
          'common.errors.PROVIDER_PROFILE_ALREADY_EXISTS',
        );
      }

      // Create provider profile WITH session
      await this.providerService.createProvider(user._id.toString(), {
        name: dto.name,
        email: dto.email,
      }, session);

      await session.commitTransaction();
      session.endSession();

      // 🔑 Return JWT with correct role
      
      const payload = this.buildUserPayload(user);
        const tokens = await this.generateTokens(payload);

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user._id,
            name: user.name,
            role: user.role,
          },
        };
       

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // =========================
  // Login
  // =========================

async loginWithOtp(dto: LoginVerifyOtpDto) {

  await this.otpService.validateOtp(dto.phone, dto.code);

  const user = await this.usersService.findByPhone(dto.phone.trim());

  if (!user) {
    throw new UnauthorizedException('common.errors.USER_NOT_FOUND');
  }

  if (user.role === RoleType.CUSTOMER) {
    throw new UnauthorizedException('common.errors.CUSTOMER_CANT_LOGIN');
  }

  let employee: Employee | null = null;

  if (user.role === RoleType.EMPLOYEE) {
    employee = await this.employeeService.findByUserId(user._id);

    if (!employee?.capabilities?.canLogin) {
      throw new UnauthorizedException('common.errors.EMPLOYEE_CANT_LOGIN');
    }
  }

  // build payload
  const payload = this.buildUserPayload(user, employee);

  // generate tokens
  const tokens = await this.generateTokens(payload);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      permissions: payload.permissions ?? [],
      capabilities: payload.capabilities ?? [],
    },
  };
}


async loginWithPassword(dto: LoginDto) {

  const user = await this.usersService.findByIdentifier(dto.identifier);

  if (!user) {
    throw new UnauthorizedException('common.errors.INVALID_CREDENTIALS');
  }

  if (!user.passwordHash) {
    throw new UnauthorizedException(
      'common.errors.PASSWORD_LOGIN_NOT_AVAILABLE_USE_OTP',
    );
  }

  const isValid = await this.usersService.validatePassword(
    dto.password,
    user.passwordHash,
  );

  if (!isValid) {
    throw new UnauthorizedException('common.errors.INVALID_CREDENTIALS');
  }

  
  const payload = this.buildUserPayload(user);

 
  const tokens = await this.generateTokens(payload);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      permissions: payload.permissions ?? [],
      capabilities: payload.capabilities ?? [],
    },
  };
}


  private async buildAuthResponse(user: User, employee?: any) {
    const payload: any = {
      sub: user._id,
      userId: user._id,
      role: user.role,
    };

    if (user.role === RoleType.ADMIN) {
      payload.permissions = user.permissions ?? [];
     
    }


  if (user.role === RoleType.EMPLOYEE && employee?.capabilities) {
    payload.capabilities = employee.capabilities;
  }
     
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        permissions: payload.permissions ?? [],
        capabilities:payload.capabilities?? []
      },
    };
  }


  private buildUserPayload(user: User, employee?: any) {
  const payload: any = {
    sub: user._id,
    userId: user._id,
    role: user.role,
  };

  if (user.role === RoleType.ADMIN) {
    payload.permissions = user.permissions ?? [];
  }

  if (user.role === RoleType.EMPLOYEE && employee?.capabilities) {
    payload.capabilities = employee.capabilities;
  }

  return payload;
}

  async logoutAllUserSessions(userId: string , session?: ClientSession) {
    await this.refreshModel.updateMany(
      { userId: new Types.ObjectId(userId), revoked: false },
      { $set: { revoked: true } },
    );

    const user = await this.usersService.findById(userId, session);
    user.fcmTokens = [];
    await user.save({ session });

    return { success: true, message: 'common.success.ALL_SESSIONS_REVOKED' };
  }

}
