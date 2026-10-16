export interface ProfileUi {
  id: string;
  firstName: string;
  lastName: string;
  gender?: "MALE" | "FEMALE";
  birthDate?: string;
  email?: string;
  phone?: string;
}

export type GenderApi = "MALE" | "FEMALE";

export interface ProfileApiDto {
  id: string;
  firstName: string;
  lastName: string;
  gender: GenderApi;
  birthDate: string;
  email?: string;
  phone?: string;
  avatar?: string;
  city?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileApiResponse {
  data: ProfileApiDto;
}

export const mapApiToProfileUi = (dto: ProfileApiDto): ProfileUi => ({
  id: dto.id ?? "0",
  firstName: dto.firstName ?? "",
  lastName: dto.lastName ?? "",
  gender: dto.gender,
  birthDate: dto.birthDate,
  email: dto.email ?? "",
  phone: dto.phone ?? "",
});
