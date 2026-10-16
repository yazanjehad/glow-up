// Rating interfaces - supporting both old and new API formats
export interface Rating {
  average: number;
  count: number;
}

export interface RatingDetailed {
  summary?: {
    averageRating?: number;
    totalReviews?: number;
    distribution?: { [key: string]: number };
  };
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: { id: string; name: string };
  }[];
  current_page?: number;
  total_pages?: number;
}

export interface WorkingHoursWeeklyItem {
  day:
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface WorkingHours {
  timezone?: string;
  weekly?: WorkingHoursWeeklyItem[];
  exceptions?: any[];
}

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function parseTimeToMinutes(s: string | undefined): number {
  if (!s || typeof s !== "string") return 0;
  const parts = s.trim().split(/[:\s]/);
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function matchDay(w: WorkingHoursWeeklyItem, currentDayIndex: number): boolean {
  const d = w.day;
  if (d == null || d === "") return false;
  if (typeof d === "number") return d === currentDayIndex;
  const num = parseInt(String(d), 10);
  if (!Number.isNaN(num)) return num === currentDayIndex;
  const normalized = String(d).trim().toUpperCase();
  if (
    normalized.length >= 3 &&
    DAY_NAMES[currentDayIndex].startsWith(normalized.slice(0, 3))
  )
    return true;
  return normalized === DAY_NAMES[currentDayIndex];
}

export function getCurrentOpenStatus(
  weekly: WorkingHoursWeeklyItem[] | undefined,
): { isOpen: boolean; openUntil?: string; nextOpening?: { day: string; time: string, date: string } } {
  if (!weekly?.length) return { isOpen: false };
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 is Sunday
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const getDayHours = (dayIdx: number) => {
    let day = weekly.find((w) => matchDay(w, dayIdx));
    if (!day && weekly.length === 7 && dayIdx < 7) {
      day = weekly[dayIdx];
    }
    return day;
  };

  const today = getDayHours(currentDayIndex);

  const isOpenNow = (dayHours: WorkingHoursWeeklyItem | undefined) => {
    if (!dayHours || !dayHours.isOpen) return false;
    const openMin = parseTimeToMinutes(dayHours.openTime);
    const closeMin = parseTimeToMinutes(dayHours.closeTime);
    return currentMin >= openMin && currentMin < closeMin;
  };

  if (today && today.isOpen && isOpenNow(today)) {
    return { isOpen: true, openUntil: today.closeTime };
  }

  // Not open now, find the next opening slot
  for (let i = 0; i < 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const dayHours = getDayHours(nextDayIndex);

    if (dayHours?.isOpen) {
      const closeMin = parseTimeToMinutes(dayHours.closeTime);

      // If it's today
      if (i === 0) {
        // If we already passed today's closing time, we looking for future days
        if (currentMin >= closeMin) continue;
        // If we are before today's opening time, then today IS the next opening
      }

      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + i);

      return {
        isOpen: false,
        nextOpening: {
          day: DAY_NAMES[nextDayIndex],
          time: dayHours.openTime || "",
          date: `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, "0")}-${nextDate.getDate().toString().padStart(2, "0")}`,
        },
      };
    }
  }

  return { isOpen: false };
}

export type LocalizedName = { ar?: string; en?: string; _id?: string };

const getLang = (): "ar" | "en" => {
  if (typeof window === "undefined") return "en";
  const v = (localStorage.getItem("language") || localStorage.getItem("i18nextLng") || "").toLowerCase();
  return v.startsWith("ar") ? "ar" : "en";
};

const pickLocalized = (
  val: string | LocalizedName | null | undefined,
  lang: "ar" | "en",
) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val?.[lang] ?? val?.en ?? val?.ar ?? "";
};

export const looksLikeDbId = (s: string | null | undefined): boolean => {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  return t.length >= 12 && /^[a-f0-9]+$/i.test(t);
};

const safeStr = (
  val:
    | string
    | LocalizedName
    | { name?: LocalizedName; ar?: string; en?: string; code?: string }
    | null
    | undefined,
): string => {
  if (val == null) return "";
  if (typeof val === "string") return val;
  const o = val as Record<string, unknown>;
  const n = o.name ?? o.ar ?? o.en ?? o.code;
  return typeof n === "string" ? n : safeStr(n as LocalizedName);
};

export interface ProviderCategoryApiDto {
  _id: string;
  code?: string;
  name?: LocalizedName;
}

export interface ProviderTypeApiDto {
  _id: string;
  code?: string;
  name?: LocalizedName;
}

export interface ProviderServiceItemApiDto {
  _id: string;
  type: ProviderTypeApiDto | string;
  name?: string | LocalizedName;
  description?: string | LocalizedName;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  image?: string;
}

export interface ProviderServiceCategoryApiDto {
  _id: string;
  category: ProviderCategoryApiDto | string;
  items: ProviderServiceItemApiDto[];
}

// Alias for compatibility with colleague's code
export type ProviderServiceCategoryDto = ProviderServiceCategoryApiDto;

// Employee interfaces
export interface EmployeeApiDto {
  _id: string;
  providerId: string;
  profileImage?: string;
  userId: string;
  name: string;
  position: {
    _id: string;
    code: string;
    name: { en: string; ar: string; _id: string };
  };
  services: { serviceItemId: string; addedAt: string; isActive: boolean }[];
  permissions: {
    canLogin: boolean;
    viewOwnBookings: boolean;
    viewStats: boolean;
    addBreakTime: boolean;
  };
  workingHours: WorkingHours;
  rating: Rating;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeUi {
  id: string;
  name: string;
  position: string;
  services: string[];
  workingHours: WorkingHoursWeeklyItem[];
  rating?: {
    average: number;
    count: number;
  };
  img?: string;
}

// Packages
export interface ProviderPackageItemApiDto {
  serviceItemId: string;
  quantity: number;
}

// Documents
export interface DocumentApiDto {
  _id: string;
  type?: {
    _id: string;
    key?: string;
    code?: string;
    name?: string | LocalizedName;
  };
  blobPath?: string;
  filename?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface DocumentUi {
  id: string;
  typeName: string;
  typeCode?: string;
  fileUrl: string;
  filename: string;
  uploadedAt: string;
}

export interface ProviderPackageApiDto {
  _id?: string;
  name: string;
  desc?: string;
  price: number;
  items: ProviderPackageItemApiDto[];
  isActive?: boolean;
}

export interface SalonUi {
  id: string;
  name?: string;
  email?: string;
  description?: string;
  policy?: string;
  serviceLocation?: "home" | "salon" | "both";
  category?: string;
  packages?: ProviderPackageApiDto[];
  gallery?: string[];

  rating?: number;
  city?: string;
  street?: string;
  address?: string;
  reviews?: number;

  price?: number;

  location?: string;

  services?: ProviderServiceUiItem[];

  isOpen?: boolean;
  openUntil?: string;
  nextOpening?: {
    day: string;
    time: string;
    date: string;
  };

  servesMen?: boolean;
  servesWomen?: boolean;
  workingHours?: WorkingHours | null;

  status?: string;
  phone?: string;
  phones?: string[];
  employees?: EmployeeUi[];
  isFavorite?: boolean;
  coverImage?: string | null;
  appointmentStrategy: "DIRECT" | "NEED_APPROVAL";
  documents?: DocumentUi[];
}

export interface SalonApiDto {
  _id: string;
  userId: string;
  email?: string;
  name: string;
  address?: string;
  status?: string;
  phone?: string;
  phones?: string[];
  price?: number;
  gallery?: string[];
  serviceLocation?: "home" | "salon" | "both";
  services?: ProviderServiceCategoryApiDto[];
  packages?: ProviderPackageApiDto[];
  rating?: Rating | RatingDetailed;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  city?: string;
  coverImage?: string | null;
  description?: string;
  policy?: string | LocalizedName;
  appointmentStrategy?: "DIRECT" | "NEED_APPROVAL";
  genderType?: "MALE" | "FEMALE" | "BOTH" | string;

  logo?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  type?:
  | string
  | ProviderTypeApiDto
  | {
    _id: string;
    code: string;
    name: { en: string; ar: string; _id: string };
  };
  workingHours?: WorkingHours;

  employees?: EmployeeApiDto[];
  isFavorite?: boolean;
  rejectionReason?: string;
  documents?: DocumentApiDto[];
}

export interface SalonApiResponse {
  data: SalonApiDto[];
  message?: string;
  status?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

/** GET /providers/home response: newest, topRated, nearest (when lat/lng sent), anonymousList */
export interface HomeProvidersApiResponse {
  newest: SalonApiDto[];
  topRated: SalonApiDto[];
  nearest: SalonApiDto[];
  anonymousList: SalonApiDto[];
}

export interface PaginatedSalonResponse {
  data: SalonUi[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface UpdateProviderStatusDto {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  reason?: string;
}

export const mapApiToSalon = (
  dto: SalonApiDto,
  lang?: "ar" | "en",
): SalonUi => {
  const currentLang = lang || getLang();
  const gender = (dto.genderType || "").toUpperCase();

  let categoryValue = "Salon";
  if (dto.type) {
    if (typeof dto.type === "string") {
      categoryValue = looksLikeDbId(dto.type) ? "Salon" : dto.type;
    } else if (typeof dto.type === "object") {
      const typeObj = dto.type as { name?: LocalizedName; code?: string };
      categoryValue =
        pickLocalized(typeObj.name, currentLang) || typeObj.code || "Salon";
    }
  }

  let ratingValue = 0;
  let reviewsValue = 0;
  if (dto.rating) {
    if ("average" in dto.rating) {
      ratingValue = dto.rating.average ?? 0;
      reviewsValue = dto.rating.count ?? 0;
    } else if ("summary" in dto.rating) {
      ratingValue = dto.rating.summary?.averageRating ?? 0;
      reviewsValue = dto.rating.summary?.totalReviews ?? 0;
    }
  }

  const locationValue = dto.address || "Unknown";

  const {
    isOpen: isOpenNow,
    openUntil: openUntilTime,
    nextOpening: nextOpeningInfo,
  } = getCurrentOpenStatus(dto.workingHours?.weekly);
  const imageBase =
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api-staging.theglowhub.com.sa";

  const isValidPath = (v: string) =>
    v && v.trim() && !/^string$/i.test(v.trim());

  const toImageUrl = (path: string) => {
    if (!imageBase || !isValidPath(path)) return null;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${imageBase.replace(/\/$/, "")}/files/public?path=${encodeURIComponent(clean)}`;
  };

  // حل مشكلة اختلاف اسم الصورة بين APIs
  const coverPath = dto.coverImage ?? (dto as any)._coverImage;

  const fullImageUrl =
    coverPath && isValidPath(coverPath)
      ? toImageUrl(coverPath) ?? null
      : null;

  return {
    id: dto._id ?? "0",
    name: dto.name ?? "Unknown Salon",
    email: dto.email ?? "",
    serviceLocation: dto.serviceLocation,
    description: dto.description ?? "Unknown description",
    policy: pickLocalized(dto.policy, currentLang) || undefined,
    category: categoryValue,

    gallery:
      dto.gallery
        ?.map((g) => toImageUrl(g))
        .filter((u): u is string => !!u) ?? [],

    rating: ratingValue,
    reviews: reviewsValue,

    price: dto.price,
    // city: dto.city,
    // street: dto.street,
    address: dto.address,
    location: locationValue,

    packages: dto.packages ?? [],
    services: mapProviderServicesToUiItems(dto.services ?? []),

    coverImage: fullImageUrl ?? "/No image available.png",

    isOpen: isOpenNow,
    openUntil: openUntilTime,
    nextOpening: nextOpeningInfo,

    servesMen: gender === "MALE" || gender === "BOTH",
    servesWomen: gender === "FEMALE" || gender === "BOTH",

    workingHours: dto.workingHours ?? null,

    status: dto.status ?? "undefined",
    phone: dto.phone ?? "",
    phones: dto.phones ?? [],

    isFavorite: dto.isFavorite ?? false,
    appointmentStrategy: dto.appointmentStrategy ?? "DIRECT",
    employees:
      dto.employees?.map((e) => ({
        id: e._id,
        name: safeStr(e.name),
        position:
          pickLocalized(e.position?.name, currentLang) ||
          (e.position as { code?: string })?.code ||
          "",
        services: (e.services ?? []).map((s) => s.serviceItemId),
        workingHours: e.workingHours?.weekly ?? [],
        rating: e.rating
          ? {
            average: e.rating.average ?? e.rating,
            count: e.rating.count ?? 1,
          }
          : { average: 0, count: 0 },
        img: e.profileImage ? toImageUrl(e.profileImage) ?? "/defult.png" : "/defult.png"
      })) ?? [],
    documents: ((dto as any).documents ?? []).map((doc: DocumentApiDto) => ({
      id: doc._id,
      typeName:
        typeof doc.type?.name === "string"
          ? doc.type.name
          : pickLocalized(doc.type?.name as LocalizedName, currentLang) ||
            doc.type?.code ||
            "",
      typeCode: doc.type?.code,
      fileUrl:
        doc.blobPath && isValidPath(doc.blobPath)
          ? toImageUrl(doc.blobPath) ?? ""
          : "",
      filename: doc.filename ?? "",
      uploadedAt: doc.uploadedAt ?? "",
    })),
  };
};

export interface ProviderServiceUiItem {
  id: string;
  categoryId?: string;
  typeId?: string;
  categoryLabel?: string;
  typeLabel?: string;

  name: string;
  description?: string;
  price: number;
  duration?: number;
  durationMinutes?: number;
  category?: string;
  subCategory?: string;
  isActive?: boolean;
}

export const mapProviderServicesToUiItems = (
  services: ProviderServiceCategoryApiDto[] = [],
  lang?: "ar" | "en",
): ProviderServiceUiItem[] => {
  const currentLang = lang || getLang();

  return services.flatMap((cat) => {
    const categoryId =
      typeof cat.category === "string" ? cat.category : cat.category?._id || "";

    const categoryLabel =
      typeof cat.category === "string"
        ? cat.category
        : pickLocalized(cat.category?.name, currentLang) || cat.category?.code || "";

    return (cat.items ?? []).map((it) => {
      const itName = pickLocalized(it.name, currentLang);
      const itDesc = pickLocalized(it.description, currentLang);
      const typeId = typeof it.type === "string" ? it.type : it.type?._id || "";

      const typeLabel =
        typeof it.type === "string"
          ? it.type
          : pickLocalized(it.type?.name, currentLang) || it.type?.code || "";

      const durationValue = Number(it.durationMinutes) || 30;

      return {
        id: it._id,
        categoryId,
        typeId,
        categoryLabel,
        typeLabel,
        name: itName || "Unknown",
        description: itDesc || "",
        price: Number(it.price) || 0,
        durationMinutes: durationValue,
        duration: durationValue,
        category: categoryLabel,
        subCategory: typeLabel,
        isActive: typeof it.isActive === "boolean" ? it.isActive : true,
      };
    });
  });
};
