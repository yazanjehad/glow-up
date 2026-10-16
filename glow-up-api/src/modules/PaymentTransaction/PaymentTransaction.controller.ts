import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';

import { PaymentTransactionsService } from './PaymentTransaction.service';
import { ProviderService } from '../provider/provider.service';
import { RoleType } from 'src/common/enum/roletype.enum';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionType } from 'src/common/enum/permission.enum';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { GetPaymentTransactionsDto } from './dto/GetPaymentTransactions.dto';
import { PaymentTransactionsResponseDto } from './dto//PaymentTransactionsResponse.dto';
@ApiTags('Payment Transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('payment-transactions')
export class PaymentTransactionsController {
  constructor(
    private readonly paymentTransactionsService: PaymentTransactionsService,
  ) {}

    @Roles(RoleType.PROVIDER, RoleType.ADMIN, RoleType.SUPER_ADMIN)
    @Get()
    @ApiOperation({ summary: 'Get payment transactions by provider' })
    @ApiOkResponse({ type: PaymentTransactionsResponseDto })
    getPaymentTransactions(
    @Req() req: any,
    @Query() query: GetPaymentTransactionsDto,
    ) {
    return this.paymentTransactionsService.getTransactionsForUser(
        req.user,
        query.providerId,
        query.page,
        query.limit,
        query.sortOrder,
    );
    }
}