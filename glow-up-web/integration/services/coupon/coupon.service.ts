import { post, get } from "../../http/http.client";
import type {
  CreateCouponDto,
  UseCouponDto,
  CouponResponseDto,
} from "./coupon.types";

export const CouponService = {
 
  async createCoupon(
    token: string,
    data: CreateCouponDto
  ): Promise<CouponResponseDto> {
    const res = await post<CouponResponseDto>("/coupon", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  },


  async useCoupon(
    token: string,
    code: string,
    data: UseCouponDto
  ): Promise<CouponResponseDto> {
    const res = await post<CouponResponseDto>(`/coupon/use/${code}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  },

 
  /**
   * Validate coupon for the authenticated user by `code` + `providerId`.
   * Preferred: GET /coupon/code/:code/:providerId
   * Fallback (older backend): search inside GET /coupon/my
   */
  async getCouponByCode(
    token: string,
    code: string,
    providerId: string
  ): Promise<CouponResponseDto> {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedProviderId = providerId.trim();

    // 1) Preferred endpoint (matches Swagger and validates against receivesPhone)
    try {
      const res = await get<any>(`/coupon/code/${normalizedCode}/${normalizedProviderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = res.data?.data ?? res.data;
      if (body && typeof body === "object") return body as CouponResponseDto;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404) throw error;

      // Only fallback when the endpoint/router is missing.
      // If the coupon is invalid for the authenticated user, we should not "rescue" it via /coupon/my.
      const data = error?.response?.data;
      const message = data?.message;
      const messageStr = typeof message === "string" ? message : undefined;
      const rawStr = typeof data === "string" ? data : undefined;

      const isMissingRoute =
        (messageStr && /cannot get|no route/i.test(messageStr)) ||
        (rawStr && /cannot get|coupon\/code/i.test(rawStr));

      if (!isMissingRoute) throw error;
    }

    // 2) Fallback: search coupon inside GET /coupon/my
    let page = 1;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const res = await get<{ data: CouponResponseDto[]; pagination?: { hasNextPage?: boolean } }>(
        `/coupon/my?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const coupons = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? (res.data as CouponResponseDto[])
          : [];

      const found = coupons.find((c) => {
        const cCode = (c.code || "").trim().toUpperCase();
        const cProviderId = typeof c.providerId === "object" ? c.providerId?._id : c.providerId;
        return cCode === normalizedCode && String(cProviderId ?? "").trim() === normalizedProviderId;
      });

      if (found) return found;

      hasMore = res.data?.pagination?.hasNextPage ?? false;
      page++;
      if (coupons.length < limit) hasMore = false;
    }

    const err = new Error("Coupon not found!");
    (err as any).response = { status: 404, data: { message: "Coupon not found!" } };
    throw err;
  },

  async getMyCoupons(token: string, page = 1, limit = 10): Promise<CouponResponseDto[]> {
    const res = await get<{ data: CouponResponseDto[] } | CouponResponseDto[]>("/coupon/my", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });

    const body = res.data as any;
    if (Array.isArray(body)) return body;
    return Array.isArray(body?.data) ? body.data : [];
  },
};
