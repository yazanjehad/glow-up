import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AzureStorageService } from './storage/azure-storage.service';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceProvider } from '../provider/schemas/service-provider.schema';
import { Employee } from '../employee/schemas/employee.schema';
import { User } from '../users/schemas/user.schema';
import {
  FileCategory,
  FileEntityType,
  UploadFileDto,
} from './dto/uploadfile.dto';
import { CustomerProfile } from '../customer/schemas/customer-profile.schema';
import { Ad } from '../ads/schemas/ads.schema';

@Injectable()
export class FileService {
  constructor(
    private readonly azureStorage: AzureStorageService,

    @InjectModel(ServiceProvider.name)
    private providerModel: Model<ServiceProvider>,

    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,

    @InjectModel(Ad.name)
    private adModel: Model<Ad>,
    @InjectModel(CustomerProfile.name)
    private customerModel: Model<CustomerProfile>,

  ) { }

  /* =====================================================
     UPLOAD
  ===================================================== */

  async upload(
    dto: UploadFileDto,
    file: Express.Multer.File,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('common.errors.FILE_REQUIRED');
    }
     
    if (dto.entityId && !Types.ObjectId.isValid(dto.entityId.trim())) {
      throw new BadRequestException('common.errors.INVALID_ENTITY_ID');
    }

    const folder = this.resolveFolder(dto);

    // ✅ IMPORTANT: azureStorage.upload MUST return blobPath only
    const blobPath = await this.azureStorage.upload(folder, file);

    // Store blobPath in DB (NOT full URL)
    await this.attachToEntity(dto, blobPath, userId);

    return {
      // ✅ public endpoint
      url: `${process.env.API_URL}/files/public?path=${blobPath}`,
      blobPath, // optional useful for debugging
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      entityType: dto.entityType,
      fileCategory: dto.fileCategory,
      uploadedAt: new Date(),
    };
  }

  /* =====================================================
     FOLDER RESOLUTION
  ===================================================== */

  private resolveFolder(dto: UploadFileDto) {
    switch (dto.entityType) {
      case FileEntityType.PROVIDER:
        return `providers/${dto.entityId}/${dto.fileCategory}`;

      case FileEntityType.EMPLOYEE:
        return `employees/${dto.entityId}/${dto.fileCategory}`;

      case FileEntityType.CUSTOMER:
        return `customers/${dto.fileCategory}`;

      case FileEntityType.AD:
        return `ads/${dto.entityId}`;

      default:
        throw new BadRequestException('common.errors.INVALID_ENTITY_TYPE');
    }
  }

  /* =====================================================
     ATTACH FILE TO ENTITY (STORE blobPath)
  ===================================================== */

  private async attachToEntity(
    dto: UploadFileDto,
    blobPath: string,
    userId: string,
  ) {
    switch (dto.entityType) {
      case FileEntityType.PROVIDER:
        if (!dto.entityId) {
          throw new BadRequestException('common.errors.ENTITY_ID_REQUIRED_FOR_PROVIDER');
        }
        await this.assertProviderOwner(dto.entityId, userId);

        if (dto.fileCategory === FileCategory.GALLERY) {
          await this.providerModel.updateOne(
            { _id: dto.entityId },
            { $push: { gallery: blobPath } },
          );
        }else if (dto.fileCategory === FileCategory.DOCUMENT) {
          await this.providerModel.updateOne(
            { _id: dto.entityId },
            { $push: { documents: blobPath } },
          );
        } else {
          const field = this.resolveProviderField(dto.fileCategory);

          await this.providerModel.updateOne(
            { _id: dto.entityId },
            { $set: { [field]: blobPath } },
          );
        }
        break;

      case FileEntityType.EMPLOYEE:
        if (!dto.entityId) {
          throw new BadRequestException('common.errors.ENTITY_ID_REQUIRED_FOR_EMPLOYEE');
        }
        await this.assertEmployeeAccess(dto.entityId, userId);

        await this.employeeModel.updateOne(
          { _id: dto.entityId },
          { $set: { profileImage: blobPath } },
        );
        break;

      case FileEntityType.CUSTOMER:

        await this.assertCustomerOwner(userId);
        await this.customerModel.updateOne(
          { userId: new Types.ObjectId(userId)  },
          { $set: { profileImage: blobPath } },
        );
        break;

      case FileEntityType.AD:

        if (!dto.entityId) {
          throw new BadRequestException('common.errors.ENTITY_ID_REQUIRED_FOR_AD');
        }

        await this.adModel.updateOne(
          { _id: dto.entityId },
          { $set: { banner: blobPath } },
        );

        break;

    }
  }


  async deleteProviderFile(
  providerId: string,
  fileCategory: FileCategory,
  blobPath: string,
  userId: string,
) {
  if (!Types.ObjectId.isValid(providerId)) {
    throw new BadRequestException('common.errors.PROVIDER_ID_INVALID');
  }

  if (!blobPath) {
    throw new BadRequestException('common.errors.BLOB_PATH_REQUIRED');
  }

  await this.assertProviderOwner(providerId, userId);

  const provider = await this.providerModel
    .findById(providerId)
    .select('gallery documents')
    .lean();

  if (!provider) {
    throw new NotFoundException('common.errors.PROVIDER_NOT_FOUND');
  }

  if (fileCategory === FileCategory.GALLERY) {
    if (!provider.gallery?.includes(blobPath)) {
      throw new NotFoundException('common.errors.IMAGE_NOT_FOUND_IN_GALLERY');
    }

    await this.providerModel.updateOne(
      { _id: providerId },
      { $pull: { gallery: blobPath } },
    );
  }

  else if (fileCategory === FileCategory.DOCUMENT) {
    if (!provider.documents?.includes(blobPath)) {
      throw new NotFoundException('common.errors.DOCUMENT_NOT_FOUND');
    }

    await this.providerModel.updateOne(
      { _id: providerId },
      { $pull: { documents: blobPath } },
    );
  }

  else {
    throw new BadRequestException('common.errors.INVALID_FILE_CATEGORY_FOR_DELETION');
  }

  return {
    success: true,
    message: 'File removed successfully',
    blobPath,
  };
}

  /* =====================================================
     PROVIDER FIELD MAPPING
  ===================================================== */

  private resolveProviderField(
    fileCategory: FileCategory,
  ): 'logo' | 'coverImage' {
    switch (fileCategory) {
      case FileCategory.LOGO:
        return 'logo';

      case FileCategory.COVER:
        return 'coverImage';

      default:
        throw new BadRequestException('common.errors.UNSUPPORTED_PROVIDER_FILE_CATEGORY');
    }
  }

  /* =====================================================
     AUTHORIZATION CHECKS
  ===================================================== */

  private async assertProviderOwner(
    providerId: string,
    userId: string,
  ) {
    const provider = await this.providerModel
      .findById(providerId)
      .select('_id userId')
      .lean();

    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    if (provider.userId?.toString() !== userId) {
      throw new ForbiddenException('common.errors.CANNOT_UPDATE_THIS_PROVIDER');
    }
  }

  private async assertEmployeeAccess(
    employeeId: string,
    userId: string,
  ) {
    const employee = await this.employeeModel
      .findById(employeeId)
      .select('_id userId providerId')
      .lean();

    if (!employee) {
      throw new NotFoundException('common.errors.EMPLOYEE_NOT_FOUND');
    }

    if (employee.userId?.toString() === userId) {
      return;
    }

    const provider = await this.providerModel
      .findById(employee.providerId)
      .select('_id userId')
      .lean();

    if (!provider) {
      throw new NotFoundException('common.errors.SERVICE_PROVIDER_NOT_FOUND');
    }

    if (provider.userId?.toString() !== userId) {
      throw new ForbiddenException('common.errors.CANNOT_MODIFY_EMPLOYEE');
    }
  }
  private async assertCustomerOwner(userId: string) {
    const customer = await this.customerModel
      .findOne({ userId:new Types.ObjectId(userId)  })
      .select('_id')
      .lean();

    if (!customer) {
      throw new NotFoundException('common.errors.CUSTOMER_PROFILE_NOT_FOUND');
    }
  }

  /* =====================================================
     PUBLIC IMAGE STREAM
  ===================================================== */

  async getPublicImage(blobPath: string) {
    if (!blobPath) {
      throw new BadRequestException('common.errors.FILE_PATH_REQUIRED');
    }

    return this.azureStorage.download(blobPath);
  }
}
