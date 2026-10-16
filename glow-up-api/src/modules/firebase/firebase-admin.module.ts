import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('FirebaseAdminModule');

        try {
          if (admin.apps.length > 0) {
            return admin.app();
          }

          const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
          const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
          const privateKey = configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n')
            .replace(/^"|"$/g, '')
            .trim();

          if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID');
          if (!clientEmail) throw new Error('Missing FIREBASE_CLIENT_EMAIL');
          if (!privateKey) throw new Error('Missing FIREBASE_PRIVATE_KEY');

          const app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });

          logger.log('Firebase Admin SDK connected successfully');
          return app;
        } catch (error: any) {
          logger.error(`Firebase connection failed: ${error.message}`);
          throw error;
        }
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseAdminModule {}