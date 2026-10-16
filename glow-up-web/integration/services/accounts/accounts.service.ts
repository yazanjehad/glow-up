import {
  ProfileUi,
  ProfileApiDto,
  mapApiToProfileUi,
} from "@/app/models/accounts-types";
import {
  SupportApiDto,
  SupportUi,
  mapApiToSupportUi,
  SupportCategoryApi,
} from "@/app/models/support-type";
import { get, patch, post } from "../../http/http.client";

export const profileService = {
  async getCustomer(): Promise<ProfileUi> {
    const apiResponse = await get<ProfileApiDto | { data: ProfileApiDto }>("/customer/me");
    const data = (apiResponse.data as any)?.data ?? apiResponse.data;
    return mapApiToProfileUi(data);
  },
  async updateCustomer(data: Partial<ProfileUi>): Promise<ProfileUi> {
    const payload: any = {};
    
    if (data.firstName !== undefined) payload.firstName = data.firstName;
    if (data.lastName !== undefined) payload.lastName = data.lastName;
    if (data.gender !== undefined) payload.gender = data.gender?.toUpperCase();
    if (data.birthDate !== undefined) payload.birthDate = data.birthDate;
    // NOTE: email/phone are intentionally NOT sent — the backend
    // UpdateCustomerProfileDto whitelists only firstName/lastName/gender/birthDate
    // and rejects unknown properties (forbidNonWhitelisted) with 400.

    const apiResponse = await patch<ProfileApiDto>("/customer/me", payload);
    return mapApiToProfileUi(apiResponse.data);
  },
};
export const supportService = {
  async getMySupports(): Promise<SupportUi[]> {
    const apiResponse = await get<SupportApiDto[]>("/tickets/my");
    return apiResponse.data.map(mapApiToSupportUi);
  },

  async createSupport(data: {
    category: SupportCategoryApi;
    subject: string;
    message: string;
  }): Promise<SupportUi> {
    const payload = {
      category: data.category,
      subject: data.subject,
      message: data.message,
    };

    const apiResponse = await post<SupportApiDto>("/tickets", payload);
    return mapApiToSupportUi(apiResponse.data);
  },
};
