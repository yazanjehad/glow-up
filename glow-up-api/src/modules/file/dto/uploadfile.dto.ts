import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsString, ValidateIf } from 'class-validator';

export enum FileEntityType {
  PROVIDER = 'PROVIDER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
  AD = 'AD',
}

export enum FileCategory {
  LOGO = 'logo',
  COVER = 'cover',
  GALLERY = 'gallery',
  DOCUMENT = 'document',
  PROFILE = 'profile',
  BANNER='banner',
}

export class UploadFileDto {
  @ApiProperty({ enum: FileEntityType })
  @IsEnum(FileEntityType)
  entityType: FileEntityType;

    // 👇 required for all except CUSTOMER
  @ApiPropertyOptional()
  @ValidateIf(o => o.entityType !== FileEntityType.CUSTOMER)
  @IsDefined({ message: 'entityId is required for this entity type' })
  @IsString()
  entityId?: string;
  
  @ApiProperty({ enum: FileCategory })
  @IsEnum(FileCategory)
  fileCategory: FileCategory;
}
