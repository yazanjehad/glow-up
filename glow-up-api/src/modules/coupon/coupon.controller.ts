import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApiBearerAuth, ApiExtraModels, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Coupon } from './schemas/coupon.schema';
import { CouponResponseDto } from './dto/coupon.response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { CouponUsageDto } from './dto/coupon.usage.dto';
import { CouponStatus } from './enum/coupon.status';
import { GetCouponsFilterDto } from './dto/get.coupons.filter.dto';
import { Audit } from '../audit/audit.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
@ApiTags('Coupons')
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
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
@Roles(RoleType.CUSTOMER, RoleType.ADMIN, RoleType.PROVIDER)
@ApiExtraModels(Coupon)
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

 
@Post()
@Audit('Create Coupon')
@ApiOperation({ summary: 'Create new coupon purchase', description: 'purchase a new coupon' })
@ApiOkResponse({ type: Coupon })
create(
  @Body() dto: CreateCouponDto,
  @Req() req
) {
  return this.couponService.purchaseCoupon(dto, req.user.sub);
}

//   /* =========================================================
//      Use Coupon By Code
//   ========================================================= */
//   @Post('use/:code')
//   @Roles(RoleType.CUSTOMER)
//   @ApiOperation({
//     summary: 'Use coupon using coupon code',
//     description: `
// Use coupon by providing coupon code and usage details.
// Supports partial usage automatically.
//     `,
//   })
//   @ApiParam({
//     name: 'code',example: 'GLOW-VI5E01',description: 'Coupon unique code',
//   })
//   @ApiOkResponse({
//     description: 'Coupon usage recorded successfully',type: CouponUsageDto,
//   })
//   async useCoupon(
//     @Req() req,
//     @Param('code') code: string,
//     @Body() usageDto: CouponUsageDto,
//   ) {
//     return this.couponService.useCoupon(
//       req.user.sub,
//       code,
//       usageDto,
//     );
//   }


  @Get('code/:code/:providerId')
  @ApiOperation({
      summary: 'Get coupon details by code',
      description: 'Retrieve details of a coupon by its unique code, for the authenticated user (receivesPhone) to verify if the code is valid. And return the details of the coupon.',
    })
  @ApiResponse({ type: Coupon })   
  async getByCode(@Param('code') code: string,@Param('providerId') providerId: string, @Req() req) {
 
    return this.couponService.getByCode(
      code,
      req.user.sub,
      providerId
    );
  }


@Get('my')
@ApiOperation({
  summary: 'Get my coupons',
  description:
    'Retrieve paginated list of coupons purchased by the authenticated user',
})
@ApiResponse({ status: 200, type: [Coupon] })
async getMyCoupons(
  @Req() req,
  @Query() query: GetCouponsFilterDto
) {
  return this.couponService.getMyCoupons(
    req.user.sub,
    query
  );
}



@Get()
@Roles(RoleType.ADMIN,RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.VIEW_COUPONS)

@ApiOperation({
  summary: 'Get all coupons (Admin/Super Admin)',
  description: 'Retrieve all coupons with optional status filter and pagination',
})
@ApiResponse({ status: 200, type: [Coupon] })
async getAllCoupons(
  @Query() query: GetCouponsFilterDto,
  @Req() req: any,
) {
  return this.couponService.getAllCoupons(query, req.user.sub);
}

}
