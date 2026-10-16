import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap, catchError } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_KEY } from './audit.decorator';
import { Types, Model } from 'mongoose';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest();

    let oldData = {};
    if ((request.method === 'PATCH' || request.method === 'PUT') && request.params.id) {
      const segments = request.url.split('/').filter(Boolean);
      const collectionName = segments[0];
      const id = request.params.id;

      const Model = this.auditService.getModelForCollection(collectionName) as Model<any>;
      if (Model && Types.ObjectId.isValid(id)) {
        const doc = await Model.findById(id).lean().exec();
        if (doc && request.body && typeof doc === 'object') {
          for (const key of Object.keys(request.body)) {
            if (key in doc) oldData[key] = doc[key];
          }
        }
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        let newData = {};

        if (request.method === 'POST') {
          newData = response;
        }

        else if (request.method === 'PATCH' || request.method === 'PUT') {
          if (request.body && typeof response === 'object') {
            for (const key of Object.keys(request.body)) {
              if (key in response) {
                newData[key] = response[key];
              }
            }
          }
        }

        await this.auditService.log({
          action,
          method: request.method,
          path: request.url,
          newData,
          oldData,
          statusCode: 200,
          userId: request.user?.userId,
          phone: request.phone,
        });
      }),
      catchError(async (error) => {
        await this.auditService.log({
          action,
          method: request.method,
          path: request.url,
          newData: request.body,
          oldData,
          statusCode: error.status || 500,
          userId: request.user?.userId,
          phone: request.phone,
        });

        throw error;
      }),
    );
  }
}