import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UserStatus } from '../users/enum/userstatus.enum';
import { RejectProviderDto } from './dto/reject-provider.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from '../../common/enum/roletype.enum';
import { ApiOkResponse } from '@nestjs/swagger';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { UpdateProviderStatusDto } from './dto/update-provider-status.dto';
import { Audit } from '../audit/audit.decorator';
 import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { UpdatePermissionsDto, UpdatePermissionsResponseDto } from './dto/update-permissions.dto';
import { DeleteAccountDto } from '../users/dto/delete-account.dto';


@ApiTags('Admin')
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
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* =====================================================
     Create Admin (SUPER_ADMIN only)
     ===================================================== */

  @Post('user')
  @Audit('Create Admin User')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new admin user' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }


  @Get('me')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiOkResponse({ type: CreateAdminDto })
  async getEmployeeProfile(
    @Req() req
  ) {
    const userId =  req.user.sub;

    return this.adminService.getAdminProfile(
      userId,
    );
  }
@Patch('/:id/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@ApiBearerAuth('access-token')
@ApiOperation({
  summary: 'Update ADMIN permissions (Super Admin only)',
  description:
    'Allows SUPER_ADMIN to update permissions of an ADMIN user.',
})
@ApiOkResponse({
  description: 'Permissions updated successfully',
  type: UpdatePermissionsResponseDto,
})
 
async updateUserPermissions(
  @Param('id') userId: string,
  @Body() dto: UpdatePermissionsDto,
) {
  return this.adminService.updateAdminPermissions(
    userId,
    dto.permissions,
  );
}

  /* =====================================================
   Providers Approval
   ===================================================== */

  @Get('providers/pending')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PROVIDER_APPROVE,PermissionType.PROVIDER_VIEW)
  @ApiOperation({ summary: 'Get pending service providers' })
  @ApiOkResponse({ type: ProviderResponseDto, isArray: true })
  getPendingProviders() {
    return this.adminService.getPendingProviders();
  }

  @Patch('providers/:id/approve')
  @Audit('Approve Service Provider')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PROVIDER_APPROVE)
  @ApiOperation({ summary: 'Approve service provider' })
  approveProvider(@Param('id') providerId: string) {
    return this.adminService.approveProvider(providerId);
  }

  @Patch('providers/:id/reject')
  @Audit('Reject Service Provider')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
   @Permissions(PermissionType.PROVIDER_APPROVE)
  @ApiOperation({ summary: 'Reject service provider' })
  rejectProvider(
    @Param('id') providerId: string,
    @Body() dto: RejectProviderDto,
  ) {
    return this.adminService.rejectProvider(providerId, dto.reason);
  }

// Update provider status (Admin/Super Admin)
@Patch('providers/:id/status')
@Audit('Update Provider Status')
@Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
 @Permissions(PermissionType.PROVIDER_APPROVE)
@ApiOperation({
   summary: 'Update provider status (Admin/Super Admin)', 
  description: 'Update provider status (APPROVED, REJECTED, SUSPENDED). Reason is required for REJECTED and SUSPENDED status.' })
@ApiOkResponse({ type: ProviderResponseDto })  
updateProviderStatus(
  @Param('id') providerId: string,
  @Query() dto: UpdateProviderStatusDto,
) {
  return this.adminService.updateProviderStatus(providerId, dto);
}


  /* =====================================================
     Users Management
     ===================================================== */

  @Patch('users/:id/status')
  @Audit('Update User Status')
  @Roles(RoleType.SUPER_ADMIN)
   @Permissions(PermissionType.PROVIDER_APPROVE)
  @ApiOperation({ summary: 'Update user status (activate/suspend)' })
  updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
    //@Body('status') status: UserStatus,
    //@Body() body: { status: UserStatus },
  ) {
    return this.adminService.updateUserStatus(userId, dto.status);
  }
  // @Patch('users/:id/status')
  // @ApiOperation({ summary: 'Update user status (activate/suspend)' })
  // updateUserStatus(@Param('id') userId: string, @Body() body: any) {
  //   return this.adminService.updateUserStatus(userId, body?.status);
  // }

  /* =====================================================
     Get All Admins (SUPER_ADMIN only)
     ===================================================== */

  @Get('users/admins')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get paginated admin users (only ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getAllAdmins(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.adminService.getAllAdmins({ page, limit });
  }

  @Patch('users/:id/delete')
  @Audit('Admin Delete User')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.DELETED_ACCOUNT)
  @ApiOperation({ summary: 'Admin soft delete user account' })
  async deleteUserByAdmin(
    @Param('id') userId: string,
    @Req() req,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.adminService.deleteUserByAdmin(
      userId,
      req.user,
      dto.reason,
    );
  }
}
