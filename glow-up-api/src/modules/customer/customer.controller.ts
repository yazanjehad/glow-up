
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';

import { CustomerService } from './customer.service';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RoleType } from '../../common/enum/roletype.enum';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
 import { PermissionsGuard } from 'src/common/guards/permissions.guard';

import { FavoriteDto } from './dto/favorite.dto';

import { GetCustomerMeResponseDto } from './dto/get-customer-profile.dto'; // MOD
import {
  GetCustomerFavoritesResponseDto,
  FavoriteProviderResponseDto,
} from './dto/get-customer-favorites.dto'; // MOD
import { GetCustomersFilterDto } from './dto/get-customers-filter.dto';
import { Audit } from '../audit/audit.decorator';
import { PermissionType } from 'src/common/enum/permission.enum';
 import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Customer')
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
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
@Roles(RoleType.CUSTOMER)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService
    
  ) {}

  /* ================= Get My Profile ================= */
  @UseGuards(JwtAuthGuard)

  @Get('me')
  @ApiOperation({ summary: 'Get my customer profile' })
  @ApiOkResponse({ type: GetCustomerMeResponseDto }) // ✅ MOD
  async getMyProfile(@Req() req): Promise<GetCustomerMeResponseDto> {
    // ✅ MOD
    return this.customerService.getMyProfile(req.user.userId);
  }

  /* ================= Update My Profile ================= */
  @UseGuards(JwtAuthGuard, RolesGuard)

  @Patch('me')
  @Audit('Update Customer Profile')
  @ApiOperation({ summary: 'Update my customer profile' })
  async updateMyProfile(@Req() req, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerService.updateMyProfile(req.user.userId, dto); // ✅ MOD (was req.user.sub)
  }

  /* ================= Favorites ================= */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('favorites')
  @ApiOperation({ summary: 'Get my favorite providers' })
  @ApiOkResponse({ isArray: true, type: FavoriteProviderResponseDto }) // ✅ MOD
  async getFavorites(@Req() req): Promise<GetCustomerFavoritesResponseDto> {
    // ✅ MOD
    return this.customerService.getFavorites(req.user.userId); // ✅ MOD (was req.user.sub)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('favorites')
  @ApiOperation({ summary: 'add favorite provider' })
  async addFavorite(@Req() req, @Body() dto: FavoriteDto) {
    return this.customerService.addFavorite(req.user.userId, dto.providerId); // ✅ MOD (was req.user.sub)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('favorites/:providerId')
  @ApiOperation({ summary: 'remove favorite provider' })
  async removeFavorite(@Req() req, @Param('providerId') providerId: string) {
    return this.customerService.removeFavorite(req.user.userId, providerId); // ✅ MOD (was req.user.sub)
  }

  ///// Admin: List Customers with Pagination, Search, and Date Filters
    @Get('list')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
   @Permissions(PermissionType.VIEW_CUSTOMERS)
  @ApiOperation({ summary: 'List all customers with bookings & ratings (Super Admin only)' })
  async getAllCustomers(@Query() filterDto: GetCustomersFilterDto) {
    return this.customerService.getAllCustomers(filterDto);
  }

 
}
