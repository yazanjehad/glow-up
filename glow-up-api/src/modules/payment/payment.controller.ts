import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Patch, 
  UseGuards, 
  Req,
  BadRequestException 
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleType } from 'src/common/enum/roletype.enum';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Audit } from '../audit/audit.decorator';
@ApiTags('Payments')
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
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /* =====================================================
     Get Payment Details by Appointment ID
     ===================================================== */
  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get payment details for a specific appointment' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async getByAppointment(@Param('appointmentId') appointmentId: string, @Req() req) {
    const payment = await this.paymentService.findByAppointment(appointmentId);
    
    if (!payment) throw new BadRequestException('common.errors.PAYMENT_RECORD_NOT_FOUND');
    return payment;
  }

  /* =====================================================
     Mark as PAID (Cash Collection)
     ===================================================== */
  @Patch(':appointmentId/pay-cash')
  @Audit('Mark Appointment as Paid (Cash)')
  @Roles(RoleType.PROVIDER) 
  @ApiOperation({ summary: 'Mark appointment as PAID (Cash collected)' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async markAsPaid(@Param('appointmentId') appointmentId: string) {
    return this.paymentService.updateStatus(appointmentId, 'PAID');
  }

  /* =====================================================
     Refund / Cancel Payment
     ===================================================== */
  @Patch(':appointmentId/refund')
  @Audit('Mark Appointment as Refunded')
  @Roles(RoleType.PROVIDER, RoleType.ADMIN)
  @ApiOperation({ summary: 'Mark payment as REFUNDED' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async markAsRefunded(@Param('appointmentId') appointmentId: string) {
    return this.paymentService.updateStatus(appointmentId, 'REFUNDED');
  }
}