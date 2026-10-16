export type WeekDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type WorkingHoursDayDto = {
  day: WeekDay;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
};

export type WorkingHoursDto = {
  timezone: string;
  weekly: WorkingHoursDayDto[];
  exceptions?: any[];
};

export type WorkFor = "MALE" | "FEMALE" | "BOTH";
export type Gender = "MALE" | "FEMALE";

export type EmployeeDto = {
  id: string; 
  providerId: string;

  name: string;
  workFor?: WorkFor;
  gender?: Gender;

  positionId?: string;
  positionLabel?: string;

  phone?: string;
  email?: string;

  profileImage?: string;

  workingHours?: any;

  createdAt?: string;
  updatedAt?: string;

  // Ratings
  ratings?: {
    customerId: string;
    rating: number;
    comment?: string;
  }[];
  totalRatings?: number;
  averageRating?: number;
};
 