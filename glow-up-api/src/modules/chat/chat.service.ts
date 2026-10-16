import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatService {

  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel('Provider') private providerModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
  ) { }

  async getUserConversations(userId: string) {
    const conversations = await this.conversationModel
      .find({ participants: new Types.ObjectId(userId),
        lastMessage: { $exists: true, $nin: [null  , ""] }
       })
      .sort({ lastMessageAt: -1 })
      .lean();

    return await Promise.all(
      conversations.map(async (conv) => {
        if (conv.participants.length !== 2) {
          return { ...conv, salonInfo: null, customerInfo: null };
        }

        const [participantA_id, participantB_id] = conv.participants.map(p => p.toString());

        const salonForParticipantA = await this.providerModel.findOne({ userId: new Types.ObjectId(participantA_id) }).lean();

        let customerId: string;
        let salonOwnerId: string;

        if (salonForParticipantA) {
          salonOwnerId = participantA_id;
          customerId = participantB_id;
        } else {
          salonOwnerId = participantB_id;
          customerId = participantA_id;
        }

        const customerData = await this.userModel.findById(customerId).lean();
        const salonData = await this.getSalonByOwnerId(salonOwnerId);

        const salonInfo = salonData ? { id: salonData._id.toString(), name: salonData.name, coverImage: salonData.coverImage } : null;
        const customerInfo = customerData ? { id: customerId, name: customerData.name || "", image: customerData.image || null } : null;

        return { ...conv, salonInfo, customerInfo };
      })
    );
  }

  async findOrCreateConversation(participants: string[]): Promise<Conversation> {
    const [initiatorId, targetId] = participants;

    let customerId: string;
    let salonOwnerId: string;

    const salonForTarget = await this.getSalonByOwnerId(targetId);
    if (salonForTarget && salonForTarget.userId) {
      customerId = initiatorId;
      salonOwnerId = salonForTarget.userId.toString();
    } else {
      const salonForInitiator = await this.getSalonByOwnerId(initiatorId);
      if (salonForInitiator && salonForInitiator.userId) {
        customerId = targetId;
        salonOwnerId = salonForInitiator.userId.toString();
      } else {
        throw new WsException('Cannot create conversation without a valid salon participant.');
      }
    }

    const finalParticipantIds = [
      new Types.ObjectId(customerId),
      new Types.ObjectId(salonOwnerId)
    ].sort();

    let conversation = await this.conversationModel.findOne({
      participants: { $all: finalParticipantIds, $size: 2 }
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: finalParticipantIds,
      });
    }

    return conversation;
  }

  async getSalonByOwnerId(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    let salon = await this.providerModel.findById(id).lean();
    if (!salon) {
      salon = await this.providerModel.findOne({ userId: new Types.ObjectId(id) }).lean();
    }
    return salon;
  }

  async createMessage(conversationId: string, senderId: string, text: string, type: string = 'text', appointmentId?: string) {
    const messageData: any = {
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      text,
      type,
      isRead: false,
    };
    if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
      messageData.appointmentId = new Types.ObjectId(appointmentId);
    }
    const message = await this.messageModel.create(messageData);
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { lastMessage: text, lastMessageAt: new Date() }
    });
    return message;
  }

  async getMessages(conversationId: string) {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async markAsRead(conversationId: string, userId: string) {
    return this.messageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(userId) },
        isRead: false
      },
      { $set: { isRead: true } }
    );
  }
}
