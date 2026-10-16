import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConversationDto } from './dto/conversation.dto';
import { MessageDto } from './dto/message.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @ApiOperation({ summary: 'Get current user inbox with salon info' })
  @ApiResponse({ type: [ConversationDto] })
  async getMyConversations(@Req() req) {
    return await this.chatService.getUserConversations(req.user.userId);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Get message history' })
  @ApiResponse({ type: [MessageDto] })
  async getChatHistory(@Param('conversationId') conversationId: string) {
    return await this.chatService.getMessages(conversationId);
  }

  @Get('find-with/:targetUserId')
  @ApiOperation({ summary: 'Find or create conversation and return salon info' })
  @ApiResponse({ type: ConversationDto })
  async findConversation(@Req() req, @Param('targetUserId') targetUserId: string) {
    const myUserId = req.user.userId;
    const conversation = await this.chatService.findOrCreateConversation([myUserId, targetUserId]);
    const salonData = await this.chatService.getSalonByOwnerId(targetUserId);
    const result = (conversation as any).toObject ? (conversation as any).toObject() : conversation;
    return {
      ...result,
      salonInfo: salonData ? {
        id: salonData._id.toString(),
        name: salonData.name,
        coverImage: salonData.coverImage,
      } : null
    };
  }
}
