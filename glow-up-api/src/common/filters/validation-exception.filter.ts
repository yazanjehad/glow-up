import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();

    let errors: Record<string, string[]> = {};

 
    if (Array.isArray(exceptionResponse)) {
      (exceptionResponse as ValidationError[]).forEach(
        (error: ValidationError) => {
          errors[error.property] = Object.values(
            error.constraints || {},
          );
        },
      );
    }

    response.status(400).json({
      success: false,
      statusCode: 400,
      path: request.url,
      timestamp: new Date().toISOString(),
      message: 'Validation failed',
      errors,
    });
  }
}
