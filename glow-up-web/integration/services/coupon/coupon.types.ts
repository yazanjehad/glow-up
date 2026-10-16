// DTO for creating a new coupon
export interface CreateCouponDto {
  providerId: string;
  services: {
    serviceId?: string;
    /** بعض الـ APIs تتوقع serviceItemId (نفس قيمة الخدمة عند البروفايدر) */
    serviceItemId?: string;
  }[];
  receivesPhone: string;
}

// DTO for using a coupon
export interface UseCouponDto {
  appointmentId: string;
  usedAmount: number;
  usedAt: string;
}

// Coupon usage history item
export interface CouponUsageHistoryDto {
  appointmentId: string;
  usedAmount: number;
  usedAt: string;
}

// Coupon response from API (providerId قد يكون object من GET /coupon/my)
export interface CouponResponseDto {
  _id: string;
  purchaserId: string | { _id: string; name: string };
  providerId: string | { _id: string; name: string };
  services: {
    serviceId: string;
  }[];
  usageHistory: CouponUsageHistoryDto[];
  totalPrice: number;
  usedPrice?: number;
  remaining?: number;
  receivesPhone: string;
  status: "ACTIVE" | "PARTIAL_USED" | "USED" | "EXPIRED";
  code: string;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}
