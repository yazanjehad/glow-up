import { get, post } from "../../http/http.client";
import type {
  PurchasePackageDto,
  UserPackageResponseDto,
} from "./user-packages.types";

export const UserPackagesService = {

  async purchasePackage(
    token: string,
    data: PurchasePackageDto
  ): Promise<UserPackageResponseDto> {
    const res = await post<UserPackageResponseDto>(
      `/user-packages/purchase`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  },

  async getMyPackages(token: string): Promise<UserPackageResponseDto[]> {
    const res = await get<UserPackageResponseDto[] | { data?: UserPackageResponseDto[]; packages?: UserPackageResponseDto[] }>(`/user-packages/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = res.data;
    if (Array.isArray(body)) return body;
    if (body && typeof body === "object") {
      const withData = body as { data?: UserPackageResponseDto[]; packages?: UserPackageResponseDto[] };
      if (Array.isArray(withData.data)) return withData.data;
      if (Array.isArray(withData.packages)) return withData.packages;
    }
    return [];
  },

  async getPackageById(
    token: string,
    packageId: string
  ): Promise<UserPackageResponseDto> {
    const res = await get<UserPackageResponseDto>(
      `/user-packages/me/${packageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  },


  async getPackagesByServiceItem(
    token: string,
    serviceItemId: string
  ): Promise<UserPackageResponseDto[]> {
    const res = await get<
      | UserPackageResponseDto[]
      | { data?: UserPackageResponseDto[]; packages?: UserPackageResponseDto[] }
    >(`/user-packages/me/service-item/${serviceItemId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = res.data;
    if (Array.isArray(body)) return body;
    if (body && typeof body === "object") {
      const withData = body as {
        data?: UserPackageResponseDto[];
        packages?: UserPackageResponseDto[];
      };
      if (Array.isArray(withData.data)) return withData.data;
      if (Array.isArray(withData.packages)) return withData.packages;
    }
    return [];
  },
};
