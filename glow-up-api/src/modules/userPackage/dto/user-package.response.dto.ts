import { ApiProperty } from '@nestjs/swagger';
import { UserPackageItemResponseDto } from './user-package-item.response.dto';
import { UserPackageStatus } from 'src/common/enum/userpackegestatus.enum';

export class UserPackageResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  packageId: string;

  @ApiProperty()
  packageName: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ type: [UserPackageItemResponseDto] })
  items: UserPackageItemResponseDto[];

  @ApiProperty()
  paymentId: string;

  @ApiProperty({ enum: UserPackageStatus })
  status: UserPackageStatus;

  @ApiProperty()
  purchasedAt: Date;
}
