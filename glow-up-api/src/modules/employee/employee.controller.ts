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
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiHeader,
} from '@nestjs/swagger';

import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeCapabilitiesDto } from './dto/update-employee-capabilities.dto';
import { Employee } from './schemas/employee.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EmployeeInfoDto } from './dto/employee-info.dto';
 
import { Audit } from '../audit/audit.decorator';
import { PaginationDto } from './dto/pagination.dto';
import { BreakCustomRequestDto, BreakStatusUpdateDto, GetCustomBreaksQueryDto } from './dto/break-custom.dto';
import { BreakStatus } from 'src/common/enum/break-status.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionType } from 'src/common/enum/permission.enum';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@ApiTags('Employees')
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
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.PROVIDER)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
  ) {}

  /* ================= Create ================= */

  @Post()
  @Audit('Create Employee')
  @ApiOperation({ summary: 'Create employee' })
  @ApiOkResponse({ type: Employee })
  async create(@Req() req, @Body() dto: CreateEmployeeDto) {
    const providerUserId = req.user.sub;
    return this.employeeService.create(providerUserId, dto);
  }

  /* ================= Update Employee ================= */
  @Patch(':id')
  @Audit('Update Employee')
  @ApiOperation({ summary: 'Update employee' })
  async update(
    @Req() req,
    @Param('id') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const providerUserId = req.user.sub;
    return this.employeeService.update(employeeId, providerUserId, dto);
  }

  @Get('me')
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get employee profile' })
  @ApiOkResponse({ type: EmployeeInfoDto })
  async getEmployeeProfile(
     
    @Req() req,
     @Query() pagination: PaginationDto
  ) {
    const userId =  req.user.sub;

    return this.employeeService.getEmployeeProfile(
      userId,
      
      pagination.page,
      pagination.limit,
    );
  }
  /* ================= Request Break (Employee) ================= */
  @Post("/request-break")
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Request a break' })
  @ApiOkResponse({ description: 'Break request created successfully' })
  async requestBreak(
    @Req() req,
    @Body() dto: BreakCustomRequestDto,
  ) {
    const employeeUserId = req.user.sub;
    return this.employeeService.requestBreak(employeeUserId, dto);
  }

  /* ================= Get Custom Breaks (Provider) ================= */
@Get('/breaks')
@ApiOperation({ summary: 'Get all custom breaks Employee for provider with filters and pagination' })
@ApiOkResponse({ description: 'List of custom breaks with stats and pagination'})
async getCustomBreaks(
  @Req() req,
  @Query() query: GetCustomBreaksQueryDto,
) {
  const providerUserId = req.user.sub;

  return this.employeeService.getCustomBreaksByProvider(
    providerUserId,
    query,
  );
}

  /* ================= Update Break Status (Provider) ================= */
  @Patch("/breaks/:id/status")
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Update break status (APPROVED or REJECTED)' })
  @ApiOkResponse({ description: 'Break status updated successfully' })
  async updateBreakStatus(
    @Req() req,
    @Param('id') breakId: string,
    @Body() dto: BreakStatusUpdateDto,
  ) {
    const providerUserId = req.user.sub;
    return this.employeeService.updateBreakStatus(breakId, providerUserId, dto.status);
  }

  
  @Get('/breaks/employee')
  @Roles(RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get all custom breaks for employee' })
  @ApiOkResponse({ description: 'List of custom breaks for employee' })
  async getCustomBreaksForEmployee(@Req() req) {
    const employeeUserId = req.user.sub;
    return this.employeeService.getCustomBreaksForEmployee(employeeUserId);
  }

  















  /* ================= Update Employee Capabilities ================= */
  
  @Patch(':id/capabilities')
  async updateCapabilities(
    @Param('id') employeeId: string,
    @Body() body: UpdateEmployeeCapabilitiesDto,
    @Req() req,
  ) {
    const providerUserId = req.user.sub;

    const updatedEmployee = await this.employeeService.setCapabilitiesForEmployee(
      employeeId,
      providerUserId,
      body,
    );

    return updatedEmployee;
  }



  /* ================= List ================= */

  @Get()
  @ApiOperation({ summary: 'List provider employees' })
  @ApiOkResponse({ type: [EmployeeResponseDto] })
  async list(@Req() req) {
    const providerUserId = req.user.sub;
    return this.employeeService.findByProvider(
      providerUserId
    );
  }

  
  @Get('provider/:providerId')
  @Public()
  @ApiOperation({ summary: 'Fetch all employees assigned to a specific service provider' })
  @ApiOkResponse({ type: [EmployeeResponseDto] })
  async getEmployeesByProvider(
    @Param('providerId') providerId: string,
  ) {
    return this.employeeService.getByProvider(providerId);
  }

@Get('provider/:providerId/services/:serviceId')
@Public()
@ApiOperation({
  summary: 'Fetch all employees who can perform a specific service for a service provider',
})
@ApiOkResponse({ type: [EmployeeResponseDto] })
async getEmployeesByService(
  @Param('providerId') providerId: string,
  @Param('serviceId') serviceId: string,
) {
  return this.employeeService.getEmployeesByProviderAndService(
    providerId,
    serviceId,
  );
}

@Get('admin/provider/:providerId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
@Permissions(PermissionType.VIEW_EMPLOYEES)
@ApiOperation({ summary: 'Super_Admin/Admin fetch employees by provider' })
async getEmployeesByProviderForAdmin(
  @Param('providerId') providerId: string,
) {
  return this.employeeService.getByProviderForAdmin(providerId);
}



  @Get(':id/full-info')
  @Public()
  @ApiOperation({ summary: 'get full info for employee' })
  @ApiOkResponse({ type: EmployeeInfoDto })
  async getEmployeeFullInfo(
    @Param('id') employeeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.employeeService.getEmployeeFullInfoPaginated(
      employeeId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id/full-info/provider')
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get full employee info (provider only)' })
  @ApiOkResponse({ type: EmployeeInfoDto })
  async getEmployeeFullInfoProvider(
    @Param('id') employeeId: string,
    @Req() req,
     @Query() pagination: PaginationDto
  ) {
    const providerId = req.user.providerId || req.user.sub;

    return this.employeeService.getEmployeeFullInfoProvider(
      employeeId,
      providerId,
      pagination.page,
      pagination.limit,
    );
  }
}
