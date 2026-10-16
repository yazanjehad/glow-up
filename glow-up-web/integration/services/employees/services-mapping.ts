export type ProviderServiceCategory = {
  category?: { name?: { ar?: string; en?: string }; code?: string };
  items?: Array<{
    _id?: string;
    name?: string;
    type?: { name?: { ar?: string; en?: string } };
  }>;
};

export type ServiceMeta = { label: string; categoryLabel: string };

export type UiServiceItem = {
  id: string;
  label: string;
  categoryLabel: string;
};

const pickName = (n?: { ar?: string; en?: string } | null) =>
  (n?.ar || n?.en || "").trim();

export function buildProviderServicesIndex(
  providerServices: ProviderServiceCategory[],
) {
  const map = new Map<string, ServiceMeta>();

  for (const cat of providerServices || []) {
    const categoryLabel =
      pickName(cat?.category?.name) || cat?.category?.code || "خدمات";

    for (const item of cat?.items || []) {
      const id = (item?._id || "").toString();
      if (!id) continue;

      const typeLabel = pickName(item?.type?.name);
      const baseName = (item?.name || "").toString().trim();
      const label = (typeLabel || baseName || "خدمة").trim();

      map.set(id, { label, categoryLabel });
    }
  }

  return map;
}

export function mapProviderServicesToUiItems(providerServices: any[]) {
  const unique = new Map<string, UiServiceItem>();

  for (const category of providerServices || []) {
    for (const item of category?.items || []) {
      const id = (item?._id || "").toString();
      if (!id) continue;

      const label = (item?.name || "خدمة").toString().trim();

      if (!unique.has(id)) {
        unique.set(id, {
          id,
          label,
          categoryLabel: "",
        });
      }
    }
  }

  return Array.from(unique.values());
}

export function extractEmployeeServiceIds(employeeServices: any[]) {
  return (employeeServices || [])
    .map((s) => s?.serviceItemId)
    .filter(Boolean)
    .map((x) => x.toString());
}
