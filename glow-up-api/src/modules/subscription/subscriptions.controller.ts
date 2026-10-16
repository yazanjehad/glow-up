import { Body, Controller, Get, Param, Post, Patch, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { GetPlansResponseDto } from './dto/GetPlansResponse.dto';
import { GetProviderSubscriptionResponseDto } from './dto/GetProviderSubscriptionResponse.dto';
import { Audit } from '../audit/audit.decorator';
import { ProviderSubscriptionInfoDto } from './dto/ProviderSubscriptionInfo.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { GetAllSubscriptionsResponseDto } from './dto/get-all-subscriptions-response.dto';
import { GetAllSubscriptionsDto } from './dto/get-all-subscriptions.dto';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.SUBSCRIPTION_MANAGE)
  @Post('subscribe-for-provider')
  @ApiOperation({ summary: 'Admin subscribes a provider to a plan' })
  @Audit('Admin Subscribe Provider to Plan')
  subscribeForProvider(@Body() dto: CreateSubscriptionDto) {
    const { providerId, planId, notes } = dto;
    return this.subscriptionsService.subscribeProviderByAdmin(dto);
  }
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.SUBSCRIPTION_MANAGE)
  @Get()
  @ApiOperation({
    summary: 'Get all subscriptions with pagination and filters',
  })
  @ApiOkResponse({ type: GetAllSubscriptionsResponseDto })
  @Audit('Get All Subscriptions')
  getAllSubscriptions(@Query() query: GetAllSubscriptionsDto) {
    return this.subscriptionsService.getAllSubscriptions(query);
  }
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PLAN_MANAGE)
  @Post('plan')
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  @Audit('Create Subscription Plan')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PLAN_MANAGE)
  @Patch('plan/:planId')
  @ApiOperation({ summary: 'Update an existing subscription plan (Admin only)' })
  @Audit('Update Subscription Plan')
  updatePlan(@Param('planId') planId: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(planId, dto);
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Permissions(PermissionType.PLAN_MANAGE)
  @Patch('plan/:planId/deactivate')
  @ApiOperation({ summary: 'Deactivate a subscription plan (Admin only)' })
  @Audit('Deactivate Subscription Plan')
  deletePlan(@Param('planId') planId: string) {
    return this.subscriptionsService.deactivatePlan(planId);
  }

  @Get('plans')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN, RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiOkResponse({ type: [GetPlansResponseDto] })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get active subscription for a provider' })
  @ApiOkResponse({ type: GetProviderSubscriptionResponseDto })
  getProviderSubscription(@Param('providerId') providerId: string) {
    return this.subscriptionsService.getProviderSubscription(providerId);
  }

  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get subscription of the logged-in provider' })
  @Audit('Get Own Subscription Info')
  @Get('my-subscription')
  @ApiOkResponse({ type: ProviderSubscriptionInfoDto })
  getMySubscription(@Req() req: any) {
    const providerUserId = req.user.sub;
    return this.subscriptionsService.getProviderSubscriptionByUser(providerUserId);
  }
}