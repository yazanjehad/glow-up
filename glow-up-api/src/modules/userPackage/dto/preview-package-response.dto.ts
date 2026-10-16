import { ApiProperty } from '@nestjs/swagger';
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
export class PreviewPackageResponseDto {

  @ApiProperty({
    example: true
  })
  allServicesInPackage: boolean;

  @ApiProperty({
    type: [PackageCheckItemDto]
  })
  services: PackageCheckItemDto[];
}
 

