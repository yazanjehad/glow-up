import {
  Body,
  Controller,
  Get,
  Delete,  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiExtraModels,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';

import { AppointmentService } from './appointment.service';
import { AppointmentCancellationDto, AppointmentServiceDto, CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './enum/appointmentstatus.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AppointmentResponseDto } from './dto/AppointmentResponseDto';
import { GetAllAppointmentsAdminDto } from './dto/get-all-appointments-admin.dto';
import { ProviderCreateAppointmentDto } from './dto/provider-create-appointment.dto';
import { Audit } from '../audit/audit.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
 import { Permissions } from 'src/common/decorators/permissions.decorator';
 
@ApiTags('Appointments')
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
@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  /* ================= Create (Customer) ================= */

  @Post()
  @Audit('Create Appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @ApiOperation({ summary: 'Create appointment' })
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(
      req.user.sub,
      dto,
    );
  }

  /* ================= My Appointments (Customer) ================= */

   @Get('me')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(RoleType.CUSTOMER)
   @ApiOperation({ summary: 'Get my appointments' })
   @ApiOkResponse({ type: [AppointmentResponseDto] })
   @ApiQuery({
     name: 'status',
     required: false,
     enum: AppointmentStatus,
     description: 'Filter appointments by status',
   })
  getMyAppointments(
    @Req() req,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentService.getCustomerAppointments(
      req.user.sub,
      status,
    );
  }

//   /* ================= Provider Appointments ================= */

  @Get('provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  @ApiOperation({ summary: 'Get provider appointments' })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
    description: 'Filter appointments by status',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page for pagination' })
 getProviderAppointments(
    @Req() req,
    @Query('status') status?: AppointmentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const take = limit || 15;
    const skip = ((page || 1) - 1) * take;
    return this.appointmentService.getProviderAppointments(
      req.user.sub,
      status,
      skip,
      take
    );
  }

//   /* ================= Employee Appointments ================= */

  @Get('employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER,RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get employee appointments' })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AppointmentStatus,
    description: 'Filter appointments by status',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page for pagination' })

  getEmployeeAppointments(
    @Req() req,
    @Query('status') status?: AppointmentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const take = limit || 15;
    const skip = ((page || 1) - 1) * take;
    return this.appointmentService.getEmployeeAppointments(
      req.user.sub,
      status,
      skip,
      take
    );
  }


// /* ================= Update Appointment ================= */

  @ApiExtraModels(UpdateAppointmentDto, AppointmentServiceDto, AppointmentCancellationDto)
  @Patch(':id')
  @Audit('Update Appointment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER, RoleType.PROVIDER)
  @ApiOperation({ summary: 'Update my appointment (customer)' })
  @ApiBody({ type: UpdateAppointmentDto }) // ✅ هنا نخلي Swagger يفهم الـ nested DTOs
  updateAppointment(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto
  ) {
    return this.appointmentService.updateAppointment(
      req.user.sub,
      id,
      dto
    );
  }
/* ================= Cancel Appointment (Customer) ================= */
@Patch(':id/cancel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.CUSTOMER)
@Audit('Cancel Appointment')
@ApiOperation({ summary: 'Cancel my appointment(Customer)' })
cancelAppointment(
  @Req() req,
  @Param('id') id: string,
  @Query('reason') reason?: string
) {

  return this.appointmentService.cancelAppointment(
    req.user.sub,
     id,
      reason);
}
/* ================= Update Appointment Status (Provider) ================= */
/* ================= Update Appointment Status (Provider) ================= */
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.PROVIDER)
@Audit('Update Appointment Status')
@ApiOperation({
  summary: 'Update appointment status (Provider)',
  description: 'Change the status of an appointment. Only COMPLETED appointments cannot be changed.',
})
@ApiQuery({ name: 'status', enum: AppointmentStatus, required: true })
@ApiResponse({ status: 200, description: 'Appointment updated successfully', type: AppointmentResponseDto })
@ApiResponse({ status: 400, description: 'Invalid request or appointment already completed' })
async updateAppointmentStatus(
  @Param('id') appointmentId: string,
  @Req() req,
  @Query('status') status: AppointmentStatus
) {
   {

    return await this.appointmentService.updateAppointmentStatus(
      req.user.sub,
      req.user.role,
      appointmentId,
      status
    )

  }

}

  /* ================= Get Appointment by ID ================= */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get appointment by ID (Customer or Provider)' })
  @ApiOkResponse({ type: AppointmentResponseDto })
  async getAppointmentById(
    @Req() req,
    @Param('id') id: string
  ) {
    return this.appointmentService.getAppointmentById(req.user.sub, id, req.user.role);
  }

  /* ================= Super Admin: Get All Appointments ================= */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
 @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.APPOINTMENT_VIEW)
  @ApiOperation({ summary: 'Get all appointments in the system (Super Admin)' })
  @ApiOkResponse({ description: 'Paginated list of all appointments' })
  getAllAppointments(
    @Query() query: GetAllAppointmentsAdminDto
  ) {
    return this.appointmentService.getAllAppointmentsSuperAdmin(query);
  }

  @Post('provider-book')
  @Audit('Create Appointment By Provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PROVIDER)
  createByProvider(
    @Req() req,
    @Body() dto: ProviderCreateAppointmentDto,
  ) {
    return this.appointmentService.createAppointmentByProvider(
      req.user.sub,
      dto,
    );
  }


}
