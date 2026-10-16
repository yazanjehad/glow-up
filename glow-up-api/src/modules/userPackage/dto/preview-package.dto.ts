// dtos/preview-package.dto.ts
import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PreviewPackageDto {
   

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  serviceItemIds: string[];
}

export class PackageCheckItemDto {

  @ApiProperty({
    example: '698d8fb9e8fb8849f3294057'
  })
  serviceItemId: string;

  @ApiProperty({
    example: 2
  })
  total: number;

  @ApiProperty({
    example: true
  })
  inPackage: boolean;

  @ApiProperty({
    example: 2
  })
  remaining: number;
}