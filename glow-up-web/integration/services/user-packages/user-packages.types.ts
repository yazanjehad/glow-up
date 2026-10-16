export interface PackageItem {
  serviceItemId: string;
  name: string;
  type: string;
  description?: string;
  image?: string;
  durationMinutes: number;
  total: number;
  remaining: number;
}

/** حسب Swagger: POST /user-packages/purchase يطلب providerId, packageId, paymentMethod */
export type PackagePaymentMethod = "CASH" | "VISA" | "WALLET";

export interface PurchasePackageDto {
  providerId: string;
  packageId: string;
  paymentMethod: PackagePaymentMethod;
}

export interface UserPackageResponseDto {
  _id: string;
  userId: string;
  providerId: string;
  packageId: string;
  packageName: string;
  price: number;
  items: PackageItem[];
  paymentId: string;
  /** API: ACTIVE | USED_UP (Swagger) */
  status: "ACTIVE" | "USED_UP" | "EXPIRED" | "USED";
  purchasedAt: string;
}

export interface GetMyPackagesResponseDto {
  data: UserPackageResponseDto[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}
