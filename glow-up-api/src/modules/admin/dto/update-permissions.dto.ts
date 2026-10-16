import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { PermissionType } from 'src/common/enum/permission.enum';

export class UpdatePermissionsDto {
  @ApiProperty({
    enum: PermissionType,
    isArray: true,
    example: ['TICKET_REPLY', 'PROVIDER_VIEW'],
  })
  @IsArray()
  @IsEnum(PermissionType, { each: true })
  permissions: PermissionType[];
}


export class UpdatePermissionsResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ enum: PermissionType, isArray: true })
  permissions: PermissionType[];
}
