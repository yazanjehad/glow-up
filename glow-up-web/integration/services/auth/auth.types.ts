// Request DTOs
export interface RequestOTPDto {
  phone: string;
}

export interface VerifyOTPDto {
  phone: string;
  code: string;
}

export interface ProfileDto {
  firstname: string;
  lastname: string;
  email?: string;      
  password?: string;  
  gender: "MALE" | "FEMALE";
  birthDate?: string;
}

export interface ProviderProfileDto {
  name: string;
  email?: string;      
  password?: string;  
}



// Response DTOs
export class RequestOtpResponseDto {
  public message: string = "";
}
export class VerifyOtpResponsedDto {
  public nextAction: string = "";
  public otpToken?: string;
  public accessToken?: string;
  public user?: UserDto;
}
export class UserDto {
  public id: string = "";
  public name: string = "";
  public role: "CUSTOMER" | "ADMIN" | "PROVIDER" | "EMPLOYEE" | "SUPER_ADMIN" = "CUSTOMER";
  public permissions: any[] = [];
  public employeeId?: string;
  public providerId?: string;
  public canLogin?: boolean;
  public canViewOwnBookings?: boolean;
  public canViewStatistics?: boolean;
  public canManageBreakTime?: boolean;
}


export class CreateProfileResponseDto {
  public accessToken: string = "";
  public user: UserDto = new UserDto();
}





