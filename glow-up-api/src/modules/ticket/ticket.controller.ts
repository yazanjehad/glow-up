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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RoleType } from 'src/common/enum/roletype.enum';
import { AddTicketMessageDto } from './dto/add.ticketMessage.dto';
import { UpdateTicketStatus_PriorityDto } from './dto/update.ticketStatus.dto';
import { MyTicketsQueryDto } from './dto/my-tickets-query.dto';
import { adminTicketsQueryDto } from './dto/admin-tickets-query.dto';
import { Ticket, TicketMessage } from './schemas/ticket.schema';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';


@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard,PermissionsGuard)
 @ApiBearerAuth('access-token')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /* ================= Create Ticket ================= */
  @Post()
  @Roles(RoleType.CUSTOMER, RoleType.PROVIDER, RoleType.EMPLOYEE)
  
  @ApiOperation({ summary: 'Create support ticket' , description: 'Create a support ticket. Optionally include an initial message.'})
  @ApiResponse({type: Ticket})
  createTicket(@Req() req, @Body() dto: CreateTicketDto) {
    console.log('Creating ticket for user:', req.user.sub, 'with role:', req.user.role);
    return this.ticketService.createTicket(
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  /* ================= Get My Tickets ================= */
  @Get('my')
  @Roles(RoleType.CUSTOMER, RoleType.PROVIDER, RoleType.EMPLOYEE)
  @ApiOperation({ summary: 'Get tickets created by current user with optional filters' ,description: 'Get tickets created by current user. Optional filters: status, category. user cant see the message content if the message is internal note and the user is not an admin.'})
  @ApiResponse({type: Ticket})
  getMyTickets(@Req() req, @Query() query: MyTicketsQueryDto) {
    console.log('Getting tickets for user:', req.user.sub, 'with role:', req.user.role, 'and query:', query); 
    return this.ticketService.getTicketsByCreator(
      req.user.sub,
      req.user.role,
      query,
    );
  }

  /* ================= Get Ticket Details ================= */
  @Get(':id')
  @ApiOperation({ 
    summary:'get ticket details',
    description: 'Get ticket details by ID. Only the creator, assigned admin, or super admin can access the details. If the user is not an admin, internal notes will be filtered out from the messages.'})
 @ApiResponse({type: TicketMessage})
    getTicketById(@Req() req, @Param('id') ticketId: string) {
    return this.ticketService.getTicketDetails(
      ticketId,
      req.user.sub,
      req.user.role,
    );
  }

  /* ================= Add Message ================= */
  @Post(':id/messages')
  @Roles(RoleType.CUSTOMER, RoleType.PROVIDER, RoleType.EMPLOYEE, RoleType.ADMIN)

  @ApiOperation({ summary: 'Add message to ticket', description: 'Add a message to the ticket. Only users involved in the ticket (creator, assigned admin, or super admin) can add messages. Internal notes can only be added by admins or super admins.'})
  @ApiResponse({type: TicketMessage})
  addMessage(
    @Req() req,
    @Param('id') ticketId: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.ticketService.addMessage(
      ticketId,
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  /* ================= Update Ticket Status (Admin / super Admin) ================= */
  // super admin can update status and priority , admin can update status only who is assigned to the ticket
  @Patch(':id/status')
  @Roles(RoleType.ADMIN , RoleType.SUPER_ADMIN)
    @Permissions(PermissionType.TICKET_REPLY)
  @ApiOperation({ summary: 'Update ticket status or priority(Super Admin,Admin)', description: 'Admin or super admin can update ticket status. Admin can only update status if they are assigned to the ticket. Super admin can update status and priority.'})
  @ApiResponse({type: Ticket})
  updateStatus(
    @Param('id') ticketId: string ,
    @Query() dto: UpdateTicketStatus_PriorityDto,
    @Req() req,
  ) {
    return this.ticketService.updateTicketStatus(
      ticketId,
      req.user.sub,
      req.user.role,
      dto,
    );
  }



  /* ================= Get All Tickets (Super Admin,Admin) ================= */
@Get()
@Roles(RoleType.ADMIN,RoleType.SUPER_ADMIN)
 @Permissions(PermissionType.TICKET_VIEW)
@ApiOperation({ summary: 'Get all tickets with optional filters(Super Admin,Admin)', description: 'Admin can get all tickets with optional filters: status, category, creator role, priority. Admin can only see tickets assigned to them. Super admin can see all tickets.' })
getAllTickets(@Req() req, @Query() query: adminTicketsQueryDto) {
  return this.ticketService.getAllTickets(
    req.user.sub,
    req.user.role,
    query);
}

  /* ================= Assign Ticket (Admin) ================= */
  // Super admin only can assign or usassigned or chaange assigned admin to the ticket
  @Patch(':id/assign')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign ticket to admin' ,description: 'Super admin can assign the ticket to an admin, unassign it, or change the assigned admin.' })
  @ApiResponse({type: Ticket})
  assignTicket(
   @Param('id') ticketId: string,
   @Query('adminId') adminId: string,
   @Req() req) {
    return this.ticketService.assignTicket(
      ticketId, 
      adminId,
      req.user.sub,
      req.user.role,

    );
  }
}
//Admin filters (status / category / role)
//User filters (status / category)
//Pagination for messages
//Internal notes for admins only
