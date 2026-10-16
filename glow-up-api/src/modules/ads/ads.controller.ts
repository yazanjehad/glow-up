import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { GetProviderAdDto } from './dto/get-provider-ad.dto';
import { GetPublicAdDto } from './dto/get-public-ad.dto';
import { GetAdminAdDto } from './dto/get-admin-ad.dto';
 import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
@ApiTags('Ads')
@ApiBearerAuth('access-token')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /* ================= PROVIDER ENDPOINTS ================= */


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create ad (admin)' })
  create(@Req() req, @Body() dto: CreateAdDto) {
  //const adminId = req.user.sub;
    return this.adsService.create(dto);
  }


  // @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(RoleType.PROVIDER)
  // @ApiOperation({ summary: 'Update ad (provider, pending approval)' })
  // update(@Param('id') adId: string, @Req() req, @Body() dto: UpdateAdDto) {
  //   const providerId = req.user.sub;
  //   return this.adsService.update(adId, providerId, dto);
  // }


  @Get('all/provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @ApiOkResponse({ type: [GetProviderAdDto] })

  @ApiOperation({ summary: 'List ads of provider' })
  list(@Req() req) {
    const providerId = req.user.sub;
    return this.adsService.findAllByProvider(providerId);
  }

  /* ================= PUBLIC ENDPOINTS ================= */


  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List all approved ads (public)' })
  @ApiOkResponse({ type: [GetPublicAdDto] })

  listPublic() {
    return this.adsService.findAllPublic();
  }


  /* ================= ADMIN / SUPER ADMIN ENDPOINTS ================= */

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.ADD_ADS)
  @ApiOperation({ summary: 'Create ad (Admin for any saloon or website)' })
  createByAdmin(@Body() dto: CreateAdDto) {
    return this.adsService.createByAdmin(dto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.VIEW_ADS)
  @ApiOkResponse({ type: [GetAdminAdDto] })

  @ApiOperation({ summary: 'List all ads for admin (all statuses)' })
  listAllAds() {
    return this.adsService.findAllForAdmin();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.ADD_ADS)
  @ApiOperation({ summary: 'Approve ad (admin/super admin)' })
  approve(@Param('id') adId: string) {
    return this.adsService.approve(adId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.ADD_ADS)
  @ApiOperation({ summary: 'Reject ad (admin/super admin)' })
  reject(@Param('id') adId: string) {
    return this.adsService.reject(adId);
  }

  @Patch(':id/admin/soft-delete')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.ADD_ADS)
  @ApiOperation({ summary: 'Soft delete any ad (Admin/Super Admin)' })
  softDeleteByAdmin(@Param('id') adId: string) {
    return this.adsService.softDeleteByAdmin(adId);
  }
}
