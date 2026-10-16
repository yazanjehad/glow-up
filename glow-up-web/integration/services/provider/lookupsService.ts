import { get,post } from "@/integration/http/http.client";
import type { LookupsAllResponseDto, LookupItemDto ,LookupKey } from "./lookups.types";

export const LookupsService = {
  async getAll(): Promise<LookupItemDto[]> {
    const res = await get<LookupsAllResponseDto>("/lookups?limit=1000");
    return res.data?.data ?? [];
  },
async getByKey(key: LookupKey): Promise<LookupItemDto[]> {
  // The endpoint may return a bare array (`[...]`) or a wrapped object
  // (`{ data: [...] }`) depending on the environment. Handle both.
  const res = await get<LookupsAllResponseDto | LookupItemDto[]>(`/lookups?key=${key}`);
  const body = res.data as any;
  return Array.isArray(body) ? body : body?.data ?? [];
},
async getByKeyFromLookupsEndpoint(key: LookupKey): Promise<LookupItemDto[]> {
  // Some environments expose `GET /lookups?key=...` (not `/lookups/all`).
  const res = await get<LookupItemDto[]>(`/lookups?key=${key}`);
  return (res as any).data?.data ?? res.data ?? [];
},
async createCategory(data: {
    code: string;
    name: { en: string; ar: string };
    order?: number;
    isActive?: boolean;
  }): Promise<LookupItemDto> {
    const sanitizedCode = data.code.trim().toUpperCase().replace(/\s+/g, "_");

    const res = await post<LookupItemDto>("/lookups", {
      key: "SERVICE_CATEGORY", 
      code: sanitizedCode,
      name: data.name,
      isActive: data.isActive ?? true,
      order: data.order ?? 1,
    });

    return res.data;
  },

};
