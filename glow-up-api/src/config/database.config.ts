import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongoConfig = async (
  configService: ConfigService,
): Promise<MongooseModuleOptions> => ({
  uri: configService.get<string>('MONGO_URI'),
  dbName:configService.get<string>('MONGO_DB_NAME'),
  //uri:'mongodb+srv://mkhabbas_db_user:QrGLofAXuHykbDYV@glowup-db.b70ejm7.mongodb.net/?appName=glowup-db',
  //dbName: 'glowup-db',
  retryWrites: true,
  w: 'majority',
  autoIndex: true,
});
