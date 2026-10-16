import type { LookupItemDto } from "./lookups.types";

export const pickLocalized = (val: any, lang: "ar" | "en"): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val?.[lang] ?? val?.en ?? val?.ar ?? "";
};

export const filterByKey = (
  items: LookupItemDto[],
  key: LookupItemDto["key"],
) => {
  return items.filter((x) => x.key === key && x.isActive !== false);
};

export const buildLookupMaps = (items: LookupItemDto[]) => {
  const byId = new Map<string, LookupItemDto>();
  const byCode = new Map<string, LookupItemDto>();

  items.forEach((it) => {
    if (it?._id) byId.set(it._id, it);
    if (it?.code) byCode.set(it.code, it);
  });

  return { byId, byCode };
};
