export type PlanType = "DAYS" | "PERCENT";

export interface Plan {
  _id: string;
  name: string;
  price: number;
  type: PlanType;
  durationDays: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanPayload {
  name: string;
  price: number;
  type: PlanType;
  durationDays: number;
  commissionPercent: number;
  isActive: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  price?: number;
  type?: PlanType;
  durationDays?: number;
  commissionPercent?: number;
  isActive?: boolean;
}

export interface SubscribeProviderPayload {
  planId: string;
  providerId: string;
  paymentMethod: string;
  notes?: string;
}

export interface Subscription {
  _id: string;
  planId: Plan | string;
  providerId: string;
  paymentMethod: string;
  notes?: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface PlansResponse {
  data: Plan[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface SubscriptionResponse {
  data: Subscription;
}
