import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { MulterError } from 'multer';
import type { Response } from 'express';

@Catch(MulterError)
export class MulterExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: MulterError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response =
      ctx.getResponse<Response>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({
        success: false,
        message:
          'File size must not exceed 1MB',
      });
    }

    return response.status(400).json({
      success: false,
      message: exception.message,
    });
  }
}
