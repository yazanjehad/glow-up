import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
 
import { LookupService } from './lookup.service';
import { LookupController } from './lookup.controller';
import { Lookup, LookupSchema } from './schemas/lookup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lookup.name, schema: LookupSchema }]),
  ],
  controllers: [LookupController],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}
