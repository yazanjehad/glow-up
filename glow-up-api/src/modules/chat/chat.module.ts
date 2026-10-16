import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';

import { AuthModule } from '../auth/auth.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: 'Provider', schema: ServiceProviderSchema },
      { name: 'User', schema: UserSchema },
    ]),

    AuthModule,

    AppointmentModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule { }
