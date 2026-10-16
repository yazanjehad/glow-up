import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { RoleType } from '../../common/enum/roletype.enum';
import { UserStatus } from './enum/userstatus.enum';
import { ClientSession } from 'mongoose';
import { PermissionType } from 'src/common/enum/permission.enum';
import { OtpService } from '../auth/otp.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

import { AppointmentService } from '../appointment/appointment.service';
import { CustomerService } from '../customer/customer.service';
import { AuthService } from '../auth/auth.service';
import { ProviderService } from '../provider/provider.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
        private readonly otpService: OtpService,

    private readonly appointmentService: AppointmentService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    @InjectConnection() private readonly connection: Connection,
    private readonly providerService: ProviderService,
  ) {}

  async createUser(data: {
    phone: string;
    name: string;
    email?: string;
    password?: string;
    role: RoleType;
  },
    session?: ClientSession,
  ) {
      if (data.email) {
        const existingUser = await this.userModel.findOne({ email: data.email }).session(session ?? null);
        if (existingUser) {
          throw new BadRequestException('common.errors.EMAIL_ALREADY_EXISTS');
        }
      }

      if (data.phone) {
        const existingUser = await this.userModel.findOne({ phone: data.phone }).session(session ?? null);
        if (existingUser) {
          throw new BadRequestException('common.errors.PHONE_ALREADY_EXISTS');
        }
      }

    let passwordHash: string | undefined;

    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

  const user = await this.userModel.create(
    [{
      name: data.name,
      phone: data.phone,
      email: data.email,
      passwordHash,
      role: data.role,
    }],
    session ? { session } : undefined,
  );

  return user[0];
}


  async findById(userId: string, session?: ClientSession): Promise<User> {
    const user = await this.userModel.findById(userId).session(session ?? null).exec();
    if (!user) {
      throw new NotFoundException('common.errors.USER_NOT_FOUND');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userModel.findOne({
      phone: this.normalizePhone(phone),
    });
  }

  async findByIdentifier(identifier: string) {
    return this.userModel
      .findOne({
        $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
      })
      .select('+passwordHash');
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }


  async setUserPermissions(
  userId: string,
  permissions: PermissionType[],
): Promise<User> {
  const user = await this.userModel.findById(userId);

  if (!user) {
    throw new NotFoundException('common.errors.USER_NOT_FOUND');
  }

  user.permissions = permissions;
  return user.save();
}


  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return user.save();
  }

  async updateRole(userId: string, role: RoleType, session: ClientSession): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    if (session) {
      return user.save({ session });
    } else {
      return user.save();
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(
    password: string,
    passwordHash?: string,
  ): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    return bcrypt.compare(password, passwordHash);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ email });
    return count > 0;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
  }

///// AdminService needs this to list admins
  async findAdmins() {
    return this.userModel
      .find({ role: { $in: [RoleType.ADMIN, RoleType.SUPER_ADMIN] } })
      .select('-passwordHash') // مهم جدًا
      .lean();
  }

  getModel() {
    return this.userModel;
  }

  async startSession() {
    return this.userModel.db.startSession();
  }



  async addNotificationToken(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('common.errors.USER_NOT_FOUND');

    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    return { success: true, tokens: user.fcmTokens };
  }

async updateProfile(userId: string, dto: UpdateUserProfileDto) {
  const user = await this.findById(userId);

  if (!user) {
    throw new BadRequestException('common.errors.USER_NOT_FOUND');
  }

  if (dto.email && dto.email !== user.email) {
    const existingEmail = await this.userModel.findOne({ email: dto.email });

    if (existingEmail && existingEmail._id.toString() !== userId) {
      throw new BadRequestException('common.errors.EMAIL_ALREADY_EXISTS');
    }

    user.email = dto.email;
  }

  if (dto.name) {
    user.name = dto.name;
  }

  if (dto.phone && dto.phone !== user.phone) {
    const existingPhoneUser = await this.userModel.findOne({ phone: dto.phone });

    if (existingPhoneUser && existingPhoneUser._id.toString() !== userId) {
      throw new BadRequestException('common.errors.PHONE_ALREADY_EXISTS');
    }

    if (!dto.code) {
      await user.save(); 

      await this.otpService.generateOtp(dto.phone);

      return {
        nextAction: 'VERIFY_PHONE',
        phone: dto.phone,
      };
    }

    await this.otpService.validateOtp(dto.phone, dto.code);

    user.phone = dto.phone;
  }

  await user.save();

  return {
    success: true,
    message: 'common.success.PROFILE_UPDATED',
  };
}

async getProfile(userId: string) {
  const user = await this.userModel
    .findById(userId)
    .select('name email phone')
    .lean();

  if (!user) {
    throw new NotFoundException('common.errors.USER_NOT_FOUND');
  }

  return user;
}

async requestDeleteAccountOtp(userId: string) {
  const user = await this.userModel.findById(userId);

  if (!user || user.isDeleted) {
    throw new NotFoundException('User not found');
  }

  await this.otpService.generateOtp(user.phone, 'DELETE_ACCOUNT');

  return {
    success: true,
    message: 'OTP sent successfully',
  };
}

  async deleteUserAccount000(
    userId: string,
     otpCode: string,
    reason?: string
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user || user.isDeleted) {
        throw new NotFoundException('common.errors.USER_NOT_FOUND');
      }
      await this.otpService.validateOtp(user.phone, otpCode, 'DELETE_ACCOUNT');

      const hasUpcomingAppointments = await this.appointmentService.hasUpcomingAppointments(
        user._id.toString()
      );
      if (hasUpcomingAppointments) {
        throw new BadRequestException('common.errors.UPCOMING_APPOINTMENTS_EXIST');
      }


      user.isDeleted = true;
      user.deletedAt = new Date();
      
      user.deleteReason = reason || '';
      user.status = UserStatus.DELETED;

      user.name = 'Deleted User';
      if (user.email) user.email = `deleted_${user._id}@deleted.local`;
      user.phone = `deleted_${user._id}`;
      user.fcmTokens = [];

      await user.save({ session });

      await this.customerService.markCustomerAsDeleted(user._id.toString(),session);



      await this.authService.logoutAllUserSessions(user._id.toString(),session);

      await session.commitTransaction();
      session.endSession();

      return { success: true, message: 'common.success.ACCOUNT_DELETED_SUCCESSFULLY' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }


  async deleteUserAccount(userId: string, otpCode: string, reason?: string) {
  const session = await this.connection.startSession();
  session.startTransaction();

  try {
    const user = await this.userModel.findById(userId).session(session);
    if (!user || user.isDeleted) {
      throw new NotFoundException('common.errors.USER_NOT_FOUND');
    }

    await this.otpService.validateOtp(user.phone, otpCode, 'DELETE_ACCOUNT');

    switch (user.role) {
      case RoleType.CUSTOMER:
        await this.deleteCustomerFlow(user, reason, session);
        break;

      case RoleType.PROVIDER:
        await this.deleteProviderFlow(user, reason, session);
        break;

      default:
        throw new BadRequestException('common.errors.DELETE_ACCOUNT_NOT_ALLOWED');
    }

    await this.authService.logoutAllUserSessions(user._id.toString(), session);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'common.success.ACCOUNT_DELETED_SUCCESSFULLY',
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

private async deleteCustomerFlow(
  user: any,
  reason: string | undefined,
  session: any,
) {
  const hasUpcomingAppointments =
    await this.appointmentService.hasUpcomingAppointments(user._id.toString());

  if (hasUpcomingAppointments) {
    throw new BadRequestException('common.errors.UPCOMING_APPOINTMENTS_EXIST');
  }

  await this.markUserAsDeleted(user, reason, session);
  await this.customerService.markCustomerAsDeleted(user._id.toString(), session);
}

private async deleteProviderFlow(
  user: any,
  reason: string | undefined,
  session: any,
) {
  const provider = await this.providerService.getByOwnerUserIdWithSession(
    user._id.toString(),
    session,
  );

  if (!provider) {
    throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
  }

  const hasUpcomingAppointments =
    await this.appointmentService.hasUpcomingAppointmentsForProvider(
      provider._id.toString(),
    );

  if (hasUpcomingAppointments) {
    throw new BadRequestException('common.errors.UPCOMING_APPOINTMENTS_EXIST');
  }

  const hasActiveSubscription =
    await this.appointmentService.hasActiveSubscription(provider._id.toString());

  if (hasActiveSubscription) {
    throw new BadRequestException('common.errors.ACTIVE_SUBSCRIPTION_EXISTS');
  }

  await this.providerService.markProviderAsDeleted(
    provider._id.toString(),
    session,
    reason,
  );

  await this.providerService.deactivateEmployeesByProvider(
    provider._id.toString(),
    session,
  );

  await this.markUserAsDeleted(user, reason, session);
}

private async markUserAsDeleted(
  user: any,
  reason: string | undefined,
  session: any,
) {
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = new Types.ObjectId(user._id);
  user.deleteReason = reason || '';
  user.status = UserStatus.DELETED;

  user.name = 'Deleted User';
  if (user.email) {
    user.email = `deleted_${user._id}@deleted.local`;
  }
  user.phone = `deleted_${user._id}`;
  user.fcmTokens = [];

  await user.save({ session });
}
}

