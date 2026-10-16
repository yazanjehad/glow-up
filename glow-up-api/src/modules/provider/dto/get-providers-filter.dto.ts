import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from 'src/common/enum/providertype.enum';
import { ServiceLocation } from 'src/common/enum/service-location.enum';

import { ProviderStatus } from 'src/common/enum/providerstatus.enum';

/* ===== Custom Validator ===== */
@ValidatorConstraint({ name: 'bothOrNone', async: false })
class BothOrNoneConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    const hasLatitude = obj.latitude !== undefined && obj.latitude !== null;
    const hasLongitude = obj.longitude !== undefined && obj.longitude !== null;

    // Accept if both are undefined or both are defined
    return (hasLatitude && hasLongitude) || (!hasLatitude && !hasLongitude);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Both latitude and longitude must be provided together or not at all';
  }
}

export class GetProvidersFilterDto {
  @ApiPropertyOptional({ description: 'Search by provider name' })
  @IsOptional()
  @IsString()
  name?: string;


  @ApiPropertyOptional({ description: 'Search by service name ' })
  @IsOptional()
  @IsString()
  service?: string;


  
  @ApiPropertyOptional({ description: 'Search by SERVICE_CATEGORY name ' })
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @ApiPropertyOptional({ description: 'Search by PROVIDER_TYPE name' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by City name' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Minimum rating (e.g. 4.0)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'common.errors.NUMBER_REQUIRED' })
  @Min(0, { message: 'common.errors.NUMBER_MIN_ZERO' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Page number (default: 1)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'common.errors.NUMBER_REQUIRED' })
  @Min(1, { message: 'common.errors.NUMBER_MIN_ONE' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page (default: 10)',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'common.errors.NUMBER_REQUIRED' })
  @Min(1, { message: 'common.errors.NUMBER_MIN_ONE' })
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ServiceLocation })
  @IsOptional()
  @IsEnum(ServiceLocation)
  serviceLocation?: ServiceLocation;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
  @Validate(BothOrNoneConstraint)
  bothOrNoneCheck?: any;

  //////// For Admin: Filter by status
  // @ApiPropertyOptional({ example: 'ACTIVE' })
  // @IsOptional()
  // @IsString()
  // status?: string;

  @ApiPropertyOptional({ enum: ProviderStatus })
  @IsOptional()
  @IsEnum(ProviderStatus)
  status?: ProviderStatus;
}
