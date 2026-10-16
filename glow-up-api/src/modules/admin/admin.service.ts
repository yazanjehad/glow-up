import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { ProviderService } from '../provider/provider.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RoleType } from 'src/common/enum/roletype.enum';
import { UserStatus } from '../users/enum/userstatus.enum';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { UpdateProviderStatusDto } from './dto/update-provider-status.dto';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';
import { PermissionType } from 'src/common/enum/permission.enum';
import { ROLE_PERMISSIONS } from 'src/common/authorization/role-permissions';
import { resolveUserPermissions } from 'src/common/authorization/resolve-permissions';
import { InjectModel } from '@nestjs/mongoose';
import { ProviderSubscription } from '../subscription/schemas/provider-subscription.schema';
import { Model, Types } from 'mongoose';
import { SubscripionStatus } from 'src/common/enum/subscriptionStatus.enum';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly providerService: ProviderService,

    @InjectModel(ProviderSubscription.name)
    private providerSubscriptionModel: Model<ProviderSubscription>
  ) {}

  /* ================= Create Admin ================= */

  async createAdmin(dto: CreateAdminDto) {
    return this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      // password: dto.password,
      role: RoleType.ADMIN,
    });
  }
async getAdminProfile(userId:string){
  return this.usersService.findById(userId);
}

async updateAdminPermissions(
  userId: string,
  permissions: PermissionType[],

) {
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new NotFoundException('common.errors.USER_NOT_FOUND');
  }

  if (user.role === RoleType.SUPER_ADMIN) {
    throw new ForbiddenException('common.errors.CANNOT_MODIFY_SUPER_ADMIN_PERMISSIONS');
  }

  if (user.role !== RoleType.ADMIN) {
    throw new BadRequestException('common.errors.ONLY_ADMIN_PERMISSIONS_CAN_BE_MODIFIED');
  }

  const invalidPermissions = permissions.filter(
    (p) => !Object.values(PermissionType).includes(p),
  );

  if (invalidPermissions.length > 0) {
    throw new BadRequestException({
      message: 'common.errors.INVALID_PERMISSIONS',
      args: { permissions: invalidPermissions.join(', ') },
    });
  }

  const roleDefaults = ROLE_PERMISSIONS[user.role] || [];

  const overrides = permissions.filter(
    (p) => !roleDefaults.includes(p),
  );

  const updatedUser =
    await this.usersService.setUserPermissions(
      userId,
      overrides,
    );

  return {
    message: 'Permissions updated successfully',
    permissions: resolveUserPermissions(updatedUser),
  };
}


  // /* ================= Providers Approval ================= */

  // async getPendingProviders() {
  //   return this.providerService['providerModel'].find({
  //     status: 'PENDING',
  //   });
  // }

  /* ================= Providers Approval ================= */

  async getPendingProviders(): Promise<ProviderResponseDto[]> {
    const providers = await this.providerService['providerModel']
      .find({ status: 'PENDING' })
      .populate('userId', 'name phone email gender birthDate')
      .lean();

    return providers.map((provider: any) => {
      const user = provider.userId;

      return {
        _id: provider._id.toString(),
        name: provider.name,
        userId: user?._id?.toString(),
        genderType: provider.genderType,
        status: provider.status,
        city: provider.city,
        rating: provider.rating?.average ?? 0,
        reviewCount: provider.rating?.count ?? 0,
        phone: user?.phone,
      };
    });
  }

  async approveProvider(providerId: string) {

    const provider = await this.providerService.getByIdSimple(providerId);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    /* ===== Check Active Subscription ===== */
    const activeSubscription = await this.providerSubscriptionModel.findOne({
      providerId: provider._id,
      status: SubscripionStatus.ACTIVE,
      $or: [
        { endDate: null },
        { endDate: { $gte: new Date() } },
      ],
    });

    if (!activeSubscription) {
      throw new BadRequestException(
        'Provider cannot be approved without an active subscription',
      );
    }

    return this.providerService.approveProvider(providerId);
  }

  async rejectProvider(providerId: string, reason: string) {

    const provider = await this.providerService.getByIdSimple(providerId);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.providerService.rejectProvider(providerId, reason);
  }


  // Update provider status (Admin/Super Admin)
  async updateProviderStatus(providerId: string, dto: UpdateProviderStatusDto) {

  const provider = await this.providerService.getByIdSimple(providerId);

  if (!provider) {
    throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
  }

  /* ===== Prevent APPROVED without active subscription ===== */
  if (dto.status === ProviderStatus.APPROVED) {
    const activeSubscription = await this.providerSubscriptionModel.findOne({
      providerId: provider._id,
      status: SubscripionStatus.ACTIVE,
      $or: [
        { endDate: null },
        { endDate: { $gte: new Date() } },
      ],
    });

    if (!activeSubscription) {
      throw new BadRequestException(
        'Provider cannot be approved without an active subscription',
      );
    }
  }

  /* ===== Reason Required For Some Status ===== */
  if (
    [ProviderStatus.REJECTED, ProviderStatus.SUSPENDED].includes(dto.status)
    && !dto.reason
  ) {
    throw new BadRequestException('common.errors.REASON_REQUIRED_FOR_REJECT_OR_SUSPEND');
  }

  provider.status = dto.status;

  if (dto.reason) {
    provider.rejectionReason = dto.reason;
  }

  await provider.save();

  return provider;
}


  /* ================= Users Management ================= */

  async updateUserStatus(userId: string, status: UserStatus) {
    return this.usersService.updateStatus(userId, status);
  }

  /* ================= list of admins ================= */
  async getAllAdmins({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;

    const allAdmins = await this.usersService.findAdmins();

    const adminsOnly = allAdmins.filter(user => user.role === 'ADMIN');

    const paginatedAdmins = adminsOnly.slice(skip, skip + limit);

    return {
      success: true,
      data: paginatedAdmins,
      pagination: {
        total: adminsOnly.length,
        page,
        limit,
        totalPages: Math.ceil(adminsOnly.length / limit),
      },
    };
  }

  async deleteUserByAdmin(
    targetUserId: string,
    currentUser: any,
    reason?: string,
  ) {
    const targetUser = await this.usersService.findById(targetUserId);

    return this.usersService.deleteUserAccount(
      targetUserId,
      currentUser,
      reason,
    );
  }
}
