import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { AzureStorageService } from './storage/azure-storage.service';
import { ServiceProvider, ServiceProviderSchema } from '../provider/schemas/service-provider.schema';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { Ad, AdSchema } from '../ads/schemas/ads.schema';
import { CustomerProfile, CustomerProfileSchema } from '../customer/schemas/customer-profile.schema';
 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceProvider.name, schema: ServiceProviderSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Ad.name, schema: AdSchema },
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
    ]),
  ],
  controllers: [FileController],
  providers: [FileService, AzureStorageService],
})
export class FileModule {}
