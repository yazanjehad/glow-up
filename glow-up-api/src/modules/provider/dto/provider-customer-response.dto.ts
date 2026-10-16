import { ApiProperty } from '@nestjs/swagger';

export class ProviderCustomerResponseDto {
  @ApiProperty({ description: 'Customer ID' })
  _id: string;

  @ApiProperty({ description: 'Customer full name' })
  name: string;

  @ApiProperty({ description: 'Customer phone number', required: false })
  phone?: string;

  @ApiProperty({ description: 'Customer email', required: false })
  email?: string;

  @ApiProperty({ description: 'Customer role' })
  role: string;

  @ApiProperty({ description: 'Customer account status' })
  status: string;

  @ApiProperty({ description: 'FCM tokens for push notifications', isArray: true })
  fcmTokens: string[];
}