// i18n-exception.filter.ts

import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Request, Response } from 'express';
import { ErrorLogService } from 'src/modules/error-log/error-log.service';

@Injectable()
@Catch()
export class I18nValidationFilter implements ExceptionFilter {
  constructor(
    private readonly i18n: I18nService,
    private errorLogService: ErrorLogService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get lang from Accept-Language header for consistency across main/args
    const acceptLanguage = (request.headers['accept-language'] as string)?.split(',')[0]?.trim() || 'ar';
    const lang = acceptLanguage.startsWith('ar') ? 'ar' : 'en';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | undefined;
    let errorCode = 'UNEXPECTED';
    let details: any = undefined;

    /* ===============================
       1️⃣ Handle HttpException
    =============================== */
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;

        if (typeof r.message === 'string') {
          message = r.message;
        } else if (Array.isArray(r.message) && r.message.length) {
          message = r.message[0];
        } else {
          message = exception.message;
        }

        details = r;
      }

      errorCode =
        typeof message === 'string'
          ? message.split('.').pop() || 'ERROR'
          : 'ERROR';
    }

    /* ===============================
       2️⃣ Handle Unexpected Errors
    =============================== */
    else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
    }

    /* ===============================
       3️⃣ Fallback if no message
    =============================== */
    if (!message) {
      message = 'common.errors.UNEXPECTED';
    }

    /* ===============================
       4️⃣ Extract args from exception response
    =============================== */
    let translateArgs: Record<string, any> = {};
    if (typeof details === 'object' && details !== null && details.args) {
      translateArgs = details.args;
    }

    /* ===============================
       5️⃣ Translate only if key-like
    =============================== */
    if (
      typeof message === 'string' &&
      message.includes('.') &&
      message.startsWith('common.')
    ) {
      const translatedMessage: string = (await this.i18n.translate(message, {
        lang,
      })) as string;
      
      // Translate args that are translation keys first, then interpolate named placeholders
      if (translateArgs && Object.keys(translateArgs).length > 0) {
        const translatedArgs: Record<string, string> = {};
        for (const [key, value] of Object.entries(translateArgs)) {
          if (typeof value === 'string' && value.startsWith('common.') && value.includes('.')) {
            translatedArgs[key] = (await this.i18n.translate(value, { lang })) as string;
          } else {
            translatedArgs[key] = String(value);
          }
        }
        let finalMessage: string = translatedMessage;
        for (const [key, translatedValue] of Object.entries(translatedArgs)) {
          finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), translatedValue);
        }
        message = finalMessage;
      } else {
        message = translatedMessage;
      }
    }

    /* ===============================
       6️⃣ Save logs to DB
    =============================== */
    await this.errorLogService.logError({
      message: message,
      stack: details,
      path: request.url,
      method: request.method,
      statusCode: status,
      userId: (request as any)?.user?.id || null,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    /* ===============================
       7️⃣ Final Response
    =============================== */
    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      errorCode,
      message,
    });
  }
}
