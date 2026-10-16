export interface ProviderPackageItemDto {
  _id?: string;
  serviceItemId: string;
  name?: string;
  type?: string;
  description?: string;
  image?: string;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  quantity: number;
}

export interface ProviderPackageDto {
  _id?: string;
  name: string;
  desc: string;
  price: number;
  items: ProviderPackageItemDto[];
  isActive?: boolean;
}

export interface CreateProviderPackageDto {
  name: string;
  desc: string;
  price: number;
  items: {
    serviceItemId: string;
    quantity: number;
  }[];
}

export interface ProviderWithPackagesDto {
  _id: string;
  name: string;
  description?: string;
  packages: ProviderPackageDto[];
  services?: any[];
}

export interface ProviderPackageUiItem {
  id: string;
  name: string;
  description?: string;
  servicesIds?: string[];
  price: number;
  categoires?: string;
  isActive?: boolean;
  items?: ProviderPackageItemDto[];
}

function toSafeStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    const v = o["en"] ?? o["ar"] ?? o["name"];
    return typeof v === "string" ? v : "";
  }
  return String(val);
}

export const mapProviderPackageToUi = (
  pkg: ProviderPackageDto
): ProviderPackageUiItem => {
  return {
    id: pkg._id || "",
    name: toSafeStr(pkg.name),
    description: toSafeStr(pkg.desc),
    price: pkg.price,
    servicesIds: pkg.items.map((item) => item.serviceItemId),
    items: pkg.items,
    isActive: typeof pkg.isActive === "boolean" ? pkg.isActive : true,
  };
};

export const mapProviderPackagesToUi = (
  packages: ProviderPackageDto[]
): ProviderPackageUiItem[] => {
  return packages.map(mapProviderPackageToUi);
};
