import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
  ExecutionContext,
  Injectable,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
  ApiExtraModels,
  ApiHeader,
  ApiQuery
} from '@nestjs/swagger';

import { GetProvidersFilterDto } from './dto/get-providers-filter.dto';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { GetSlotsDto } from './dto/get-slots.dto';

import { ProviderService } from './provider.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

// Response DTOs
import { ProviderResponseDto } from './dto/provider-response.dto';
import { PaginatedProviderResponseDto } from './dto/paginated-provider-response.dto';
import { ProviderSlotsResponseDto } from './dto/provider-slots-response.dto';
import { RelatedProvidersQueryDto } from './dto/related-providers.dto';
import { use } from 'passport';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt.guard';
import { ProviderCustomerResponseDto } from './dto/provider-customer-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { LocationDto } from './dto/location.dto';
import { Audit } from '../audit/audit.decorator';
import { BreakType } from 'src/common/enum/break.type.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionType } from 'src/common/enum/permission.enum';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Injectable()
@ApiTags('Service Provider')
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
@Controller('providers')
@ApiExtraModels(ProviderSlotsResponseDto)
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  /* ================= Create Provider Profile ================= */

  // @Post()
  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(RoleType.PROVIDER)
  // @ApiOperation({ summary: 'Create provider profile' })
  // @ApiResponse({ status: 201, type: ProviderResponseDto })
  // createProvider(@Req() req, @Body() dto: CreateServiceProviderDto) {
  //   return this.providerService.createProvider(
  //     req.user.sub, // Todo: change to userid
  //     dto,
  //   );
  // }

  /* ================= Update Provider Profile ================= */

  @Patch(':id')
    // @ApiHeader({
    //   name: 'Accept-Language',
    //   description: 'Language (ar | en)',
    //   required: false,
    // })
  @Audit('Update Provider Profile')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Update provider profile' })
  @ApiResponse({ status: 200, type: ProviderResponseDto })
  updateProvider(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateServiceProviderDto,
  ) {
    return this.providerService.updateProvider(id, req.user.sub, dto);
  }

  /* ================= Provider Dashboard ================= */

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get my provider profile' })
  @ApiResponse({ status: 200, type: ProviderResponseDto })
  getMyProvider(@Req() req) {
    return this.providerService.getByOwner(req.user.sub);
  }

  /* ================= PUBLIC (Customer - No Login Required) ================= */

  // Public: Get All
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all providers with filters (Public)' })
  @ApiResponse({ status: 200, type: PaginatedProviderResponseDto })
  async getAllProviders(
    @Query() filters: GetProvidersFilterDto,
    @Req() req: any,
  ) {
    const userId = req.user ? req.user.sub : null;
    return this.providerService.findAll(filters, userId);
  }

  // Public: Get Home page 
  @Get('home')
  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get home page providers (Public),' })
async getHome(
  @Req() req: any,
  @Query() locationDto: LocationDto,
) {
  const userId = req.user?.sub;
  return this.providerService.getHomeProviders(userId, locationDto);
}

  /* ================= Get All Providers with Status Filter ================= */

  @Get('status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
      @Permissions(PermissionType.PROVIDER_VIEW)
  @ApiOperation({ summary: 'Get all providers with status filter for super admin' })
  @ApiResponse({ status: 200, type: PaginatedProviderResponseDto })
  async getProvidersByStatus(
    @Query() filters: GetProvidersFilterDto,
    @Req() req: any,
  ) {
    
    const userId = req.user ? req.user.sub : null;
    return this.providerService.findAllWithStatus(filters, userId);
  }

@Get('customers')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get all customers who booked with me' })
  @ApiResponse({
    status: 200,
    description: 'List of customers who booked this provider',
    type: [ProviderCustomerResponseDto],
  })
  async getCustomers(@Req() req): Promise<ProviderCustomerResponseDto[]> {
    const providerUserId = req.user.sub; 
    return this.providerService.getProviderCustomers(providerUserId);
  }


  @Get('booking-stats')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER , RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get booking statistics for provider' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        confirmed: { type: 'number' },
        pending: { type: 'number' },
        cancelled: { type: 'number' },
      },
    },
  })
  async getBookingStats(
    @Req() req,
    @Query('period') period: 'week' | 'month' | 'year' | '3months' | '6months' | 'all' = 'all',
  ) {
    const userId = req.user.sub;
    const role = req.user.role;

    return this.providerService.getBookingStats(userId, role, period);
  }


  @Get('provider-overview')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER , RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get provider statistics' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        totalServices: { type: 'number' },
        totalEmployees: { type: 'number' },
        totalCustomers: { type: 'number' },
        totalBookings: { type: 'number' },
        totalPackages: { type: 'number' },
      },
    },
  })
  async getStats(@Req() req) {
    const userId = req.user.sub;
    const role = req.user.role;

    return this.providerService.getProviderStats(userId, role);
  }

  @Get('revenue')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER , RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get provider revenue statistics' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        Sunday : { type: 'number' },
        Monday : { type: 'number' },
        Tuesday : { type: 'number' },
        Wednesday : { type: 'number' },
        Thursday : { type: 'number' },
        Friday : { type: 'number' },
        Saturday : { type: 'number' },
      },
    },
  })
  async getRevenueStats(
    @Req() req,
    @Query('period') period: 'week' | 'month' | 'year' = 'week',
  ) {
    const userId = req.user.sub;
    const role = req.user.role;

    return this.providerService.getRevenueStats(userId, role, period);
  }

  @Get('booking-counts')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER , RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get provider booking counts' })
  @ApiResponse({
      status: 200,
      schema: {
        type: 'object',
        properties: {
          Sunday : { type: 'number' },
          Monday : { type: 'number' },
          Tuesday : { type: 'number' },
          Wednesday : { type: 'number' },
          Thursday : { type: 'number' },
          Friday : { type: 'number' },
          Saturday : { type: 'number' },
        },
      },
    })
  async getBookingCounts(
    @Req() req,
    @Query('period') period: 'week' | 'month' | 'year' = 'week',
  ) {
    const userId = req.user.sub;
    const role = req.user.role;

    return this.providerService.getBookingCounts(userId, role, period);
  }

  // Public: Get One
  @Get(':id')
  @ApiOperation({ summary: 'Get provider by id (Public)' })
  @ApiResponse({ status: 200, type: ProviderResponseDto })
  getProvider(@Param('id') id: string) {
    return this.providerService.getById(id);
  }

  // Public: Get Slots
  @Get(':id/slots')
  @ApiOperation({ summary: 'Get available time slots (Public)' })
  @ApiResponse({
    status: 200,
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ProviderSlotsResponseDto) },
        {
          type: 'array',
          items: { $ref: getSchemaPath(ProviderSlotsResponseDto) },
        },
      ],
    },
  })
  async getProviderSlots(@Param('id') id: string, @Query() query: GetSlotsDto) {
    return this.providerService.getProviderSlots(id, query);
  }

  // Public: Get Related Providers
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related ServiceProviders (similar salons)' })
  @ApiResponse({ status: 200, type: [ProviderResponseDto] })
  async getRelatedProviders(
    @Param('id') id: string,
    @Query() query: RelatedProvidersQueryDto, // <- هنا DTO
  ) {
    return this.providerService.getRelatedProviders(id, query);
  }

@Delete('breaks/:breakId')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.PROVIDER)
 @ApiOperation({ summary: 'Delete a provider break (weekly/custom) by ID (/providers/breaks/69a859588a88c0b6bdf5bde0?type=weekly)' })
@ApiQuery({
  name: 'type',
  enum: BreakType,
})
async deleteBreak(
  @Req() req,
  @Param('breakId') breakId: string,
  @Query('type') type: BreakType,
) {
  return this.providerService.deleteBreak(
    req.user.sub,
    breakId,
    type,
  );
}



}
