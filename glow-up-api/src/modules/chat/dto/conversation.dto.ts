import { ApiProperty } from '@nestjs/swagger';

class SalonInfoDto {
  @ApiProperty({ example: 'Glow Beauty Center' })
  name: string;

  @ApiProperty({ example: 'https://example.com/cover.png', required: false })
  coverImage?: string;
}

class CustomerInfoDto {
  @ApiProperty({ example: 'احمد امجد' })
  name: string;

  @ApiProperty({ example: 'https://example.com/profile.png', required: false })
  image?: string;
}

export class ConversationDto {
  @ApiProperty({
    example: '699702b510425718e3532ea8',
    description: 'Conversation ID',
  })
  _id: string;

  @ApiProperty({
    example: [{ _id: '697938e2e9e019373ff088d1' }, { _id: '698d8728e8fb8849f329400f' }],
    description: 'Array of participant objects or IDs',
  })
  participants: any[];

  @ApiProperty({
    example: '6996d707a2a1ac935cf4668f',
    description: 'Related appointment ID (optional)',
    required: false,
  })
  appointmentId?: string;

  @ApiProperty({
    example: 'Hello!',
    description: 'Last message text in the conversation',
  })
  lastMessage: string;

  @ApiProperty({
    example: '2026-02-21T23:20:11.767Z',
    description: 'Date of last message',
  })
  lastMessageAt: string;

  @ApiProperty({
    example: '2026-02-19T12:31:49.919Z',
    description: 'Creation date of the conversation',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-02-21T23:20:11.767Z',
    description: 'Last updated date of the conversation',
  })
  updatedAt: string;

  @ApiProperty({
    example: 0,
    description: 'Mongoose version key',
  })
  __v: number;

  @ApiProperty({
    type: SalonInfoDto,
    description: 'Enriched salon information for the chat recipient',
    nullable: true,
  })
  salonInfo: SalonInfoDto | null;

  @ApiProperty({
    type: CustomerInfoDto,
    description: 'Customer information for the chat recipient',
    nullable: true,
  })
  customerInfo: CustomerInfoDto | null;
}
