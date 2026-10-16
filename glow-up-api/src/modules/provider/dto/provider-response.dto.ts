import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType } from 'src/common/enum/providertype.enum';
import { GenderType } from 'src/common/enum/gendertype.enum';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';
import { WeekDay } from 'src/common/enum/weekday.enum';
import { ProviderRatingsResponseDto } from 'src/modules/rating/dto/provider-rating-response.dto';
import { ServiceLocation } from 'src/common/enum/service-location.enum';
import { BreakStatus } from 'src/common/enum/break-status.enum';
import { appointmentStrategy } from 'src/common/enum/appointment-approve-strategy.enum';

/* ===== 1. Service Items (The actual service) ===== */
class ServiceItemResponseDto {
  @ApiProperty({ example: '66a1b2...' })
  _id: string;

  @ApiProperty({ example: '6984fddf33e0dfbe8c174408', description: 'Lookup ID for service type' })
  type: string;

  @ApiProperty({ example: 'Haircut',description: 'Service item name'   })
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  isActive: boolean;
}

/* ===== 2. Service Category (Grouping) ===== */
class ServiceCategoryResponseDto {
  @ApiProperty({ example: '66a1b2...' })
  _id: string;

  @ApiProperty({ example: '6984f91633e0dfbe8c1743ea', description: 'Category ObjectId' })
  category: string; // بدل categoryName

  @ApiProperty({ type: [ServiceItemResponseDto] })
  items: ServiceItemResponseDto[];
}

/* ===== 3. Working Hours ===== */
class WorkingDayResponseDto {
  @ApiProperty({ enum: WeekDay })
  day: string;

  @ApiProperty()
  isOpen: boolean;

  @ApiPropertyOptional()
  openTime?: string;

  @ApiPropertyOptional()
  closeTime?: string;
}
class CustomBreakResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2026-02-25' })
  date: Date;

  @ApiProperty({ example: '15:00' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  endTime: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty({ enum: BreakStatus })
  status: BreakStatus;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
class WeeklyBreakResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: WeekDay })
  day: WeekDay;

  @ApiProperty({ example: '13:00' })
  startTime: string;

  @ApiProperty({ example: '13:30' })
  endTime: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

class WorkingBreaksResponseDto {
  @ApiPropertyOptional({ type: [WeeklyBreakResponseDto] })
  weekly?: WeeklyBreakResponseDto[];

  @ApiPropertyOptional({ type: [CustomBreakResponseDto] })
  custom?: CustomBreakResponseDto[];
}

class WorkingHoursResponseDto {
  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: [WorkingDayResponseDto] })
  weekly: WorkingDayResponseDto[];

  @ApiPropertyOptional({ type: [WorkingDayResponseDto] })
  exceptions?: WorkingDayResponseDto[];

  @ApiPropertyOptional()
  breaks?: WorkingBreaksResponseDto;
}


class PackageItemResponseDto {
  @ApiProperty({ example: '6989aa7ab6e71810d4ab4ec1' })
  _id: string;

  @ApiProperty({ example: 'Haircut' })
  name: string;

  @ApiProperty({
    example: '6984fbe033e0dfbe8c1743f9',
    description: 'Lookup ID for service type',
  })
  type: string;

  @ApiPropertyOptional({ example: 'Basic haircut service' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.app/service.png' })
  image?: string;

  @ApiProperty({ example: 45 })
  durationMinutes: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 2 })
  quantity: number;
}

class PackageResponseDto {
  @ApiProperty({ example: 'Premium Haircut Package' })
  name: string;

  @ApiPropertyOptional({ example: 'Includes haircut + shampoo + styling' })
  desc?: string;

  @ApiProperty({ example: 50 })
  price: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [PackageItemResponseDto] })
  items: PackageItemResponseDto[];
}





/* ===== Main Response DTO مع employees + rating جديد ===== */
export class ProviderResponseDto {
  @ApiProperty({ example: '65a123...' })
  _id: string;

  @ApiProperty({ example: '65a123...' })
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  description?: string;

@ApiProperty({ example: '65f1c2a8e8f1d23bfc9d1111', description: 'Lookup Item ID (key = PROVIDER_TYPE)' })
type?: string;

  @ApiProperty({ enum: GenderType })
  genderType: GenderType;

  @ApiProperty({ enum: ProviderStatus })
  status: ProviderStatus;

  @ApiProperty({ type: [String] })
  phones: string[];

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  address: string;

  // @ApiPropertyOptional()
  // street?: string;

  @ApiPropertyOptional({ example: 31.9539 })
  latitude?: number;

  @ApiPropertyOptional({ example: 35.9106 })
  longitude?: number;


  @ApiProperty({
    enum: ServiceLocation,
    description: 'Where the service is provided: home, salon, or both',
    example: ServiceLocation.BOTH,
  })
  serviceLocation: ServiceLocation;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiPropertyOptional({ type: [String] })
  gallery?: string[];

  @ApiPropertyOptional({
    description: 'Is this provider a favorite of the current user',
    default: false,
  })
  isFavorite: boolean;

  @ApiProperty({ type: [ServiceCategoryResponseDto] })
  services: ServiceCategoryResponseDto[];

  @ApiPropertyOptional({ type: WorkingHoursResponseDto , example: {
      timezone: 'Asia/Riyadh',
      weekly: [
        { day: WeekDay.SUNDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: WeekDay.MONDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
      ],
      breaks: {
        weekly: [
          { day: WeekDay.MONDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' },
          { day: WeekDay.TUESDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' },
        ],
        custom: [
          { date: '2026-02-20', startTime: '13:00', endTime: '13:30', reason: 'holiday', status: BreakStatus.APPROVED },
        ]
      }
    }})
  workingHours?: WorkingHoursResponseDto;

  @ApiProperty({ type: ProviderRatingsResponseDto })
  rating: ProviderRatingsResponseDto;

  @ApiProperty({ type: [Object], description: 'List of employees, max 10' })
  employees: any[];

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiProperty({ type: [PackageResponseDto], description: 'List of packages offered by provider' })
  packages?: PackageResponseDto[];

  @ApiProperty({ enum: appointmentStrategy , example: 'NEED_APPROVAL' })
  appointmentStrategy?: appointmentStrategy


  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
