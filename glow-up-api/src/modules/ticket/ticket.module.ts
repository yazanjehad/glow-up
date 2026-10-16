import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  providers: [TicketService],
  controllers: [TicketController],
  exports: [TicketService], // if other modules need this service
})
export class TicketModule {}
