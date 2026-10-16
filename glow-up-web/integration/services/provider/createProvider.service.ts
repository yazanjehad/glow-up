import type {
  ProviderFormData,
  DayKey,
  WorkingHoursSchedule,
} from "@/store/providerStore";
import { get, patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

import type { ProviderService } from "@/app/models/provider-service-types";
import type { LookupItemDto } from "@/integration/services/provider/lookups.types";

type ApiGender = "MALE" | "FEMALE"  | "BOTH";

type ProviderMeResponse =
  | { _id: string }
  | { data: { _id: string } }
  | { provider: { _id: string } }
  | any;

const DAY_MAP: Record<DayKey, string> = {
  sunday: "SUNDAY",
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
};

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStoredProviderId(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("providerId") || "").trim();
}

function mapGender(g: ProviderFormData["genderType"]): ApiGender | undefined {
  if (!g) return undefined;
  if (g === "men") return "MALE";
  if (g === "women") return "FEMALE";
  if (g === "both") return "BOTH";
  return undefined;
}

function mapServiceLocation(mode: ProviderFormData["serviceLocation"]) {
  if (mode === "both") return "both";
  if (mode === "home") return "home";
  if (mode === "salon") return "salon";
  return undefined;
}


function mapWorkingHours(workingHours: WorkingHoursSchedule) {
  const weeklyBreaks: { day: string; startTime: string; endTime: string; reason?: string }[] = [];

  Object.entries(workingHours).forEach(([dayKey, v]) => {
    if (v.breaks && v.breaks.length > 0) {
      v.breaks.forEach((b) => {
        weeklyBreaks.push({
          day: DAY_MAP[dayKey as DayKey],
          startTime: b.from,
          endTime: b.to,
          reason: "Break",
        });
      });
    }
  });

  return {
    timezone: "Asia/Amman",
    weekly: Object.entries(workingHours).map(([dayKey, v]) => ({
      day: DAY_MAP[dayKey as DayKey],
      isOpen: Boolean(v.open),
      openTime: v.from,
      closeTime: v.to,
    })),
    breaks: {
      weekly: weeklyBreaks,
      custom: [],
    },
  };
}

function mapServicesForApi(services: ProviderService[] = []) {
  const groups = new Map<string, ProviderService[]>();

  for (const s of services) {
    const catId = (s.categoryId || "").trim();
    if (!catId) continue;

    if (!groups.has(catId)) groups.set(catId, []);
    groups.get(catId)!.push(s);
  }

  return Array.from(groups.entries())
    .map(([categoryId, items]) => ({
      category: categoryId,
      items: items
        .map((s) => {
          const isUuid = s.id && s.id.includes("-");
          return {
            ...(isUuid ? {} : { _id: s.id }),
            type: (s.typeId || "").trim(),
            name: (s.name || "").trim(),
            price: Number(s.price) || 0,
            durationMinutes: Number(s.durationMinutes) || 0,
            isActive: typeof s.isActive === "boolean" ? s.isActive : true,
          };
        })
        .filter((it) => it.type && it.name),
    }))
    .filter((cat) => cat.items.length > 0);
}

async function resolveProviderIdByMeEndpoints(): Promise<string | null> {
  const candidates = ["/providers/me"];

  for (const url of candidates) {
    try {
      const res = await get<ProviderMeResponse>(url, { headers: authHeader() });
      const data = res.data;

      const id =
        data?._id ||
        data?.data?._id ||
        data?.provider?._id ||
        data?.data?.provider?._id;

      if (id) return String(id);
    } catch {}
  }

  return null;
}

function cleanUndefined(obj: Record<string, any>) {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
}

export async function createProviderService(
  data: ProviderFormData,
  lookups?: LookupItemDto[],
): Promise<string> {
  let providerId = (data.providerId || "").trim();

  if (!providerId) providerId = getStoredProviderId();
  if (!providerId) providerId = (await resolveProviderIdByMeEndpoints()) || "";

  if (!providerId) {
    throw new Error(
      "providerId is missing. PATCH needs /providers/{id}. لازم providerId يتخزن بعد login في localStorage('providerId') أو يرجع من GET /providers/me.",
    );
  }


  const servicesForApi = mapServicesForApi(data.services);

  const payload = cleanUndefined({
    name: {
      ar: data.salonName?.trim() || undefined,
      en: data.salonNameEn?.trim() || data.salonName?.trim() || undefined,
    },
    description: {
      ar: data.salonDescription?.trim() || undefined,
      en: data.salonDescriptionEn?.trim() || data.salonDescription?.trim() || undefined,
    },
    policy: {
      ar: data.salonPolicy?.trim() || undefined,
      en: data.salonPolicyEn?.trim() || data.salonPolicy?.trim() || undefined,
    },
    genderType: mapGender(data.genderType),
    serviceLocation: mapServiceLocation(data.serviceLocation),
    phones: [],
 
    workingHours: mapWorkingHours(data.workingHours),
    services: servicesForApi,
  });

  await patch(`/providers/${providerId}`, payload, {
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
  });

  return providerId;
}