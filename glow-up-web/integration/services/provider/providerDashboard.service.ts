import { get } from "@/integration/http/http.client";

export interface ProviderOverview {
  totalServices: number;
  totalEmployees: number;
  totalCustomers: number;
  totalBookings: number;
  totalPackages: number;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export async function getProviderOverview(): Promise<ProviderOverview> {
  const response = await get<ProviderOverview>("/providers/provider-overview");
  return response.data;
}

export async function getBookingStats(period: string): Promise<BookingStats> {
  const response = await get<BookingStats>(`/providers/booking-stats?period=${period}`);
  return response.data;
}

export interface RevenuePerWeek {
  Sunday: number;
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
}

export type RevenuePerMonth = Record<string, number>; // e.g., { "2026-02": 510, "2026-01": 0, ... }

export type RevenuePerYear = Record<string, number>; // e.g., { "2022": 0, "2023": 0, ... }

export type RevenueData = RevenuePerWeek | RevenuePerMonth | RevenuePerYear;

export type RevenuePeriod = "week" | "month" | "year";

export async function getRevenue(period: RevenuePeriod): Promise<RevenueData> {
  const response = await get<RevenueData>(`/providers/revenue?period=${period}`);
  return response.data;
}
