import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog } from './schemas/error-log.schema';

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectModel(ErrorLog.name)
    private errorLogModel: Model<ErrorLog>,
  ) {}

  async logError(data: any) {
    try {
      await this.errorLogModel.create(data);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }
}
