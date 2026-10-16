export type LocalizedName = { ar?: string; en?: string; _id?: string };

export type LookupKey =
  | "PROVIDER_TYPE"
  | "EMPLOYEE_POSITION"
  | "SERVICE_CATEGORY"
  | "SERVICE_TYPE"
  | "DOCUMENT_TYPE";

export type LookupItemDto = {
  _id: string;
  key: LookupKey;
  code: string;
  name?: LocalizedName | string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LookupsAllResponseDto = {
  totalPages?: number;
  data: LookupItemDto[];
  page?: number;
  limit?: number;
  total?: number;
};
