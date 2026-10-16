import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AddWalletDto, DeductWalletDto, WalletResponseDto } from './dto/wallet.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RoleType } from 'src/common/enum/roletype.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request } from 'express';
import { Audit } from '../audit/audit.decorator';
interface JwtRequest extends Request {
  user: {
    userId: string;
    role: string;
    sub: string;
    iat: number;
    exp: number;
  };
}


@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.CUSTOMER)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

@Get('me')
@ApiOperation({ summary: 'Get wallet and transaction history for the authenticated user' })
@ApiResponse({ status: 200, description: 'Wallet data returned successfully', type: WalletResponseDto })
async getMyWallet(@Req() req: JwtRequest): Promise<WalletResponseDto> {
  const userId = req.user['userId'];

  const wallet = await this.walletService.getWallet(userId);

  return {
    userId: wallet.userId.toString(),
    balance: wallet.balance,
    transactions: wallet.transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt || new Date(),
    })),
  };
}

@Post('add')
@Audit('Add Credit to Wallet')
@ApiOperation({ summary: 'Add credit to authenticated user wallet' })
@ApiResponse({ status: 200, description: 'Wallet updated successfully', type: WalletResponseDto })
async addCredit(@Req() req: JwtRequest, @Body() dto: AddWalletDto): Promise<WalletResponseDto> {

  const userId = req.user['userId'];
  const wallet = await this.walletService.addCredit(userId, dto);

  return {
    userId: wallet.userId.toString(),
    balance: wallet.balance,
    transactions: wallet.transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt || new Date(),
    })),
  };
}

}
