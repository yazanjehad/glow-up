import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    example: '699a0c234f835856bb454356',
    description: 'Message ID',
  })
  _id: string;

  @ApiProperty({
    example: '699702b510425718e3532ea8',
    description: 'Conversation ID this message belongs to',
  })
  conversationId: string;

  @ApiProperty({
    example: '697938e2e9e019373ff088d1',
    description: 'Sender user ID',
  })
  senderId: string;

  @ApiProperty({
    example: 'Hello!',
    description: 'Message text content',
  })
  text: string;

  @ApiProperty({
    example: false,
    description: 'Whether the message has been read by the recipient',
  })
  isRead: boolean;

  @ApiProperty({
    example: 'text',
    description: 'Message type (text, image, location)',
  })
  type: string;

  @ApiProperty({
    example: '2026-02-21T19:48:51.565Z',
    description: 'Creation date of the message',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-02-21T19:48:51.565Z',
    description: 'Last update date of the message',
  })
  updatedAt: string;
}
