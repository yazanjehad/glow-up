"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import {
  ChevronRight,
  Briefcase,
  Phone,
  Mail,
  Search,
  X,
  Check,
  ChevronDown,
  Save,
  RotateCcw,
  ListChecks,
  AlertCircle,
  Pencil,
} from "lucide-react";

import { get, patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";
import type { TeamMemberForm } from "@/app/models/provider-team-types";
import {
  extractEmployeeServiceIds,
  type UiServiceItem,
} from "@/integration/services/employees/services-mapping";
import { employeesServices } from "@/integration/services/employees/employees.service";
import { employeesService } from "@/integration/services/admin/employees.service";
import { filesService } from "@/integration/services/files/files.service";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { authServices } from "@/integration/services/auth/authServices";
import { useLookupsStore } from "@/store/lookupsStore";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";

const UI = {
  containerMax: "max-w-[720px]",
  pagePadX: "px-3 sm:px-5",
  pagePadTop: "pt-4 sm:pt-6",
  cardRadius: "rounded-[20px] sm:rounded-[24px]",
  cardPad: "p-4 sm:p-5",
  cardShadow: "",

  titleH1: "text-xl sm:text-2xl",
  titleH2: "text-sm sm:text-base",
  textSmall: "text-xs",
  textBase: "text-sm",

  tabWrap: "rounded-xl",
  tabPad: "py-2.5 text-[12px] sm:text-[13px]",
  tabInnerPad: "p-1",

  infoRowPad: "p-3",
  infoRowIconBox: "h-9 w-9 rounded-xl",
  infoRowLabel: "text-[10px]",
  infoRowValue: "text-[14px]",

  btnBack: "px-2.5 sm:px-3 py-2 text-[12px] sm:text-[13px]",
  pill: "px-3 py-1 text-[11px]",

  inputWrap: "px-4 sm:px-5 py-3",
  inputText: "text-[13px] sm:text-[14px]",
  inputIcon: 16,

  primaryBtn: "py-3 sm:py-3.5 text-[13px] sm:text-[14px]",
  ghostBtn: "px-4 sm:px-5 py-3 sm:py-3.5",

  avatarBox: "h-16 w-16 sm:h-20 sm:w-20 rounded-full",
  avatarInner: "rounded-full",
  badgeBox: "h-7 w-7 rounded-xl",

  multiBtn: "px-4 py-3 sm:py-3.5 rounded-2xl",
  multiPanel: "rounded-[20px]",
  multiPanelMaxH: "max-h-[280px]",
  multiPanelPad: "p-2",
  multiFooterPad: "p-3",
};

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      {Icon && <Icon size={16} className="text-[#79A66B]" />}
      <h2 className={`${UI.titleH2} font-bold text-gray-900 tracking-tight`}>
        {children}
      </h2>
    </div>
  );
}

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizePhone(v: string) {
  const s = (v || "").trim();
  return s.startsWith("+") ? s : s;
}

function isValidEmail(v: string) {
  const s = (v || "").trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function buildImageUrl(path?: string) {
  if (!path) return "";
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  return `https://api-staging.theglowhub.com.sa/files/public?path=${encodeURIComponent(cleanPath)}`;
}

function useOnClickOutside<T extends HTMLElement>(
  refs: React.RefObject<T>[],
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const inside = refs.some((r) => r.current?.contains(target));
      if (!inside) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [refs, onOutside, enabled]);
}

function ServicesMultiSelect({
  items,
  selectedIds,
  onChange,
  disabled,
  isRTL,
}: {
  items: UiServiceItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  isRTL: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useOnClickOutside([wrapRef, panelRef], () => setOpen(false), open);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((s) =>
      (s.label || "").toLowerCase().includes(qq),
    );
  }, [items, q]);

  const toggle = (sid: string) => {
    if (disabled) return;
    onChange(
      selectedSet.has(sid)
        ? selectedIds.filter((x) => x !== sid)
        : [...selectedIds, sid],
    );
  };

  const selectedPreview = useMemo(() => {
    if (selectedIds.length === 0)
      return isRTL ? "لم يتم اختيار خدمات" : "No services selected";

    const map = new Map(items.map((x) => [x.id, x.label]));
    const labels = selectedIds
      .map((id) => map.get(id) || id)
      .filter(Boolean)
      .slice(0, 2);

    const rest = selectedIds.length - labels.length;
    return rest > 0 ? `${labels.join("، ")} +${rest}` : labels.join("، ");
  }, [selectedIds, items, isRTL]);

  return (
    <div ref={wrapRef} className="relative w-full" dir={isRTL ? "rtl" : "ltr"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`group flex w-full items-center justify-between gap-3 border-[0.1px] bg-white transition-colors hover:border-[#79A66B] ${UI.multiBtn
          } ${open
            ? "border-[#79A66B] ring-[0.1px] ring-green-100"
            : "border-gray-100"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <div className="min-w-0 text-start">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {isRTL ? "خدمات الموظف" : "Assigned Services"}
          </p>
          <p className="truncate text-[14px] font-bold text-gray-900">
            {selectedPreview}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#79A66B] text-[12px] font-bold text-white">
              {selectedIds.length}
            </span>
          )}
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-180 text-[#79A66B]" : ""
              }`}
          />
        </div>
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`absolute z-50 mt-2.5 w-full animate-in fade-in zoom-in-95 overflow-hidden border-[0.1px] border-gray-100 bg-white ${UI.multiPanel}`}
        >
          <div className="border-b-[0.1px] border-gray-100 bg-white p-3">
            <div className="flex items-center gap-3 rounded-xl border-[0.1px] border-gray-100 bg-white px-3 py-2 focus-within:border-[#79A66B] focus-within:ring-[0.1px] focus-within:ring-green-100">
              <Search size={16} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={isRTL ? "ابحث عن خدمة..." : "Search services..."}
                className="w-full bg-transparent text-[13px] font-semibold outline-none"
                autoFocus
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div
            className={`${UI.multiPanelMaxH} overflow-y-auto ${UI.multiPanelPad}`}
          >
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-gray-400">
                {isRTL ? "لا توجد نتائج" : "No results found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filtered.map((s) => {
                  const isChecked = selectedSet.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${isChecked ? "bg-green-50" : "hover:bg-gray-50"
                        }`}
                    >
                      <span
                        className={`text-[13px] font-bold ${isChecked ? "text-[#79A66B]" : "text-gray-700"
                          }`}
                      >
                        {s.label}
                      </span>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border-[0.1px] transition-all ${isChecked
                            ? "border-[#79A66B] bg-[#79A66B] text-white"
                            : "border-gray-200 bg-white"
                          }`}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className={`flex gap-2 border-t-[0.1px] border-gray-100 bg-white ${UI.multiFooterPad}`}
          >
            <button
              type="button"
              onClick={() => {
                onChange(items.map((i) => i.id));
                setOpen(false);
              }}
              className="flex-1 rounded-xl border-[0.1px] border-gray-100 py-2.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
            >
              {isRTL ? "تحديد الكل" : "Select All"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl bg-[#79A66B] py-2.5 text-[11px] font-bold text-white hover:bg-[#6A955E]"
            >
              {isRTL ? "تم" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamMemberDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [member, setMember] = useState<TeamMemberForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [origPhone, setOrigPhone] = useState("");
  const [origEmail, setOrigEmail] = useState("");

  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [allServices, setAllServices] = useState<UiServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [originalServiceIds, setOriginalServiceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"contact" | "services">("contact");

  const loadLookups = useLookupsStore((s) => s.loadAll);
  const lookupItems = useLookupsStore((s) => s.items);

  const positionDisplayLabel = useMemo(() => {
    if (!member) return "";
    const lang = isRTL ? "ar" : "en";
    const code = member.jobTitle || "";
    const opt = lookupItems.find(
      (x) => x.key === "EMPLOYEE_POSITION" && (x._id === code || x.code === code),
    );
    return opt ? (pickLocalized(opt.name, lang) || code) : code;
  }, [member, lookupItems, isRTL]);

  const loadData = useCallback(async () => {
    const [servicesItems, fullInfo] = await Promise.all([
      ServiceProvider.getServicesItemsMe(i18n.language as any),
      employeesServices.getFullInfo(id, 1, 200, i18n.language),
    ]);

    const mappedServices: UiServiceItem[] = servicesItems.map((s) => ({
      id: s.id,
      label: s.name,
      categoryLabel: s.category || "",
    }));

    return {
      fullInfo,
      normServices: mappedServices,
    };
  }, [id, i18n.language]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const { fullInfo, normServices } = await loadData();
        const provider = await authServices.getProviderMe();

        if (!alive) return;

        const emp = fullInfo.employee;
        const employees = provider?.employees || [];
        const currentEmployee = employees.find(
          (e: any) => (e._id || e.id) === id,
        );

        setMember({
          id: emp.id,
          name: emp.name,
          active: fullInfo.isActive ?? false,
          jobTitle: emp.positionLabel,
          phone: fullInfo.phone || "",
          email: fullInfo.email || "",
        } as any);

        setAvatarUrl(
          buildImageUrl(
            currentEmployee?.profileImage ||
            currentEmployee?.avatarUrl ||
            currentEmployee?.avatar,
          ),
        );
        setAvatarLoadError(false);

        setPhone(fullInfo.phone || "");
        setEmail(fullInfo.email || "");
        setOrigPhone(fullInfo.phone || "");
        setOrigEmail(fullInfo.email || "");

        // Merge provider services with employee service details for proper name display
        const serviceDetailsMap = new Map(
          (fullInfo.serviceDetails || []).map((s: { id: string; name: string }) => [s.id, s.name])
        );
        const mergedServices = normServices.map((s) => ({
          ...s,
          label: s.label || serviceDetailsMap.get(s.id) || s.id,
        }));
        // Add any employee services not in provider services
        for (const detail of fullInfo.serviceDetails || []) {
          if (!mergedServices.some((s) => s.id === detail.id) && detail.name) {
            mergedServices.push({
              id: detail.id,
              label: detail.name,
              categoryLabel: "",
            });
          }
        }
        setAllServices(mergedServices);
        setSelectedServiceIds(fullInfo.services);
        setOriginalServiceIds(fullInfo.services);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [id, i18n.language, loadData]);

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const hasContactChanges = useMemo(
    () =>
      normalizePhone(phone) !== normalizePhone(origPhone) ||
      email.trim() !== origEmail.trim(),
    [phone, email, origPhone, origEmail],
  );

  const hasServicesChanges = useMemo(() => {
    return (
      JSON.stringify([...selectedServiceIds].sort()) !==
      JSON.stringify([...originalServiceIds].sort())
    );
  }, [selectedServiceIds, originalServiceIds]);

  const saveContact = async () => {
    setContactSaving(true);
    setContactError("");

    try {
      if (!isValidEmail(email)) {
        throw new Error(isRTL ? "البريد غير صالح" : "Invalid email");
      }

      await patch(
        `/employees/${id}`,
        { phone, email },
        { headers: authHeader() },
      );

      setOrigPhone(phone);
      setOrigEmail(email);

      showFeedback(isRTL ? "تم تحديث البيانات بنجاح" : "Updated successfully");
    } catch (e: any) {
      setContactError(e?.response?.data?.message || e.message || "Failed");
    } finally {
      setContactSaving(false);
    }
  };

  const saveServices = async () => {
    setServicesSaving(true);
    setServicesError("");

    try {
      await patch(
        `/employees/${id}`,
        { services: selectedServiceIds },
        { headers: authHeader() },
      );

      const refreshed = await get(
        `/employees/${id}/full-info?page=1&limit=200`,
        {
          headers: authHeader(),
        },
      );

      const empRaw =
        (refreshed as any)?.data?.data ?? (refreshed as any)?.data ?? {};
      const emp = empRaw.employee ?? empRaw;

      const employeeServicesSource = (empRaw?.services ??
        emp?.services ??
        []) as any[];

      const freshIds = extractEmployeeServiceIds(employeeServicesSource);

      setSelectedServiceIds(freshIds);
      setOriginalServiceIds(freshIds);

      showFeedback(isRTL ? "تم تحديث الخدمات بنجاح" : "Services updated");
    } catch (e: any) {
      setServicesError(e?.response?.data?.message || e.message || "Failed");
    } finally {
      setServicesSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-100 border-t-[#79A66B]" />
      </div>
    );

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-white pb-16">
      <div
        className={`mx-auto ${UI.containerMax} ${UI.pagePadX} ${UI.pagePadTop}`}
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className={`group flex items-center gap-2 rounded-full bg-white ${UI.btnBack} font-bold border-[0.1px] border-gray-100 transition-colors hover:border-[#79A66B]`}
          >
            <ChevronRight
              size={16}
              className={`${isRTL ? "rotate-0" : "rotate-180"} transition-transform group-hover:-translate-x-1`}
            />
            {isRTL ? "العودة للقائمة" : "Back to list"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border-[0.1px] border-gray-100 bg-white px-3 py-1">
              <div
                className={`h-2 w-2 rounded-full ${member?.active ? "bg-green-500" : "bg-gray-400"
                  }`}
              />
              <span className="text-[11px] font-bold text-gray-700">
                {member?.active
                  ? isRTL
                    ? "نشط "
                    : "Active"
                  : isRTL
                    ? "غير نشط"
                    : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`relative mb-6 border-[0.1px] border-gray-100 bg-white ${UI.cardRadius} ${UI.cardPad}`}
        >
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-start">
            <div className="relative">
              <div
                className={`flex ${UI.avatarBox} items-center justify-center bg-gradient-to-br from-[#79A66B] to-[#6A955E] p-[1.5px]`}
              >
                <div
                  className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-white ${UI.avatarInner}`}
                >
                  {avatarUrl && !avatarLoadError ? (
                    <Image
                      src={avatarUrl}
                      alt={member?.name || "avatar"}
                      fill
                      className="object-cover"
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={employeesService.getGenderIcon()}
                      alt={member?.name || "avatar"}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={14} />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    const localUrl = URL.createObjectURL(file);
                    setAvatarUrl(localUrl);
                    setAvatarLoadError(false);

                    await filesService.uploadEmployeeProfile(id, file);

                    setContactError("");
                    showFeedback(
                      isRTL
                        ? "تم تحديث الصورة بنجاح"
                        : "Image updated successfully",
                    );
                  } catch (err: any) {
                    setContactError(
                      err?.response?.data?.message ||
                      err?.message ||
                      "Failed to upload image",
                    );
                  }
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className={`${UI.titleH1} break-words font-extrabold text-gray-900 tracking-tight`}
              >
                {member?.name}
              </h1>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span
                  className={`flex items-center gap-1.5 rounded-lg bg-gray-100 ${UI.pill} font-bold text-gray-600`}
                >
                  <Briefcase size={13} /> {positionDisplayLabel}
                </span>
                <span
                  className={`flex items-center gap-1.5 rounded-lg bg-green-50 ${UI.pill} font-bold text-[#79A66B]`}
                >
                  <ListChecks size={13} /> {selectedServiceIds.length}{" "}
                  {isRTL ? "خدمات" : "Services"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`mb-5 flex w-full border-[0.1px] border-gray-100 bg-gray-100 ${UI.tabWrap} ${UI.tabInnerPad}`}
        >
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex-1 min-w-0 rounded-lg px-2 text-center transition-colors font-bold border-[0.1px] ${UI.tabPad} ${activeTab === "contact"
                ? "bg-white text-[#79A66B] border-gray-100"
                : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
          >
            {isRTL ? "بيانات التواصل" : "Contact Info"}
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 min-w-0 rounded-lg px-2 text-center transition-colors font-bold border-[0.1px] ${UI.tabPad} ${activeTab === "services"
                ? "bg-white text-[#79A66B] border-gray-100"
                : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
          >
            {isRTL ? "الخدمات المقدمة " : "Assigned Services"}
          </button>
        </div>

        <div className="space-y-5">
          {activeTab === "contact" && (
            <div
              className={`animate-in slide-in-from-bottom-4 border-[0.1px] border-gray-100 bg-white ${UI.cardRadius} ${UI.cardPad}`}
            >
              <SectionTitle icon={Phone}>
                {isRTL ? "معلومات الاتصال" : "Contact Details"}
              </SectionTitle>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="px-1 text-[12px] font-bold text-gray-500">
                    {isRTL ? "رقم الجوال" : "Phone Number"}
                  </label>
                  <div
                    className={`group relative flex items-center gap-3 rounded-2xl border-[0.1px] border-gray-100 bg-gray-50 transition-colors focus-within:border-[#79A66B] focus-within:bg-white focus-within:ring-[0.1px] focus-within:ring-green-100 ${UI.inputWrap}`}
                  >
                    <Phone
                      size={UI.inputIcon}
                      className="shrink-0 text-gray-400 group-focus-within:text-[#79A66B]"
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-transparent font-bold text-gray-900 outline-none ${UI.inputText}`}
                      placeholder="+966..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="px-1 text-[12px] font-bold text-gray-500">
                    {isRTL ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <div
                    className={`group relative flex items-center gap-3 rounded-2xl border-[0.1px] border-gray-100 bg-gray-50 transition-colors focus-within:border-[#79A66B] focus-within:bg-white focus-within:ring-[0.1px] focus-within:ring-green-100 ${UI.inputWrap}`}
                  >
                    <Mail
                      size={UI.inputIcon}
                      className="shrink-0 text-gray-400 group-focus-within:text-[#79A66B]"
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-transparent font-bold text-gray-900 outline-none ${UI.inputText}`}
                      placeholder="example@mail.com"
                    />
                  </div>
                </div>
              </div>

              {contactError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border-[0.1px] border-red-100 bg-red-50 p-3 text-[13px] font-bold text-red-600">
                  <AlertCircle size={16} /> {contactError}
                </div>
              )}

              {successMsg && activeTab === "contact" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-xl border-[0.1px] border-green-100 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  {successMsg}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={saveContact}
                  disabled={!hasContactChanges || contactSaving}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#79A66B] font-bold text-white transition-colors hover:bg-[#6A955E] border-[0.1px] border-green-100 disabled:opacity-30 ${UI.primaryBtn}`}
                >
                  <Save size={16} />{" "}
                  {contactSaving
                    ? "..."
                    : isRTL
                      ? "حفظ التغييرات"
                      : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setPhone(origPhone);
                    setEmail(origEmail);
                  }}
                  disabled={!hasContactChanges || contactSaving}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-[0.1px] border-gray-100 bg-white font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 ${UI.ghostBtn}`}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div
              className={`animate-in slide-in-from-bottom-4 border-[0.1px] border-gray-100 bg-white ${UI.cardRadius} ${UI.cardPad}`}
            >
              <SectionTitle icon={ListChecks}>
                {isRTL ? "تخصيص الخدمات" : "Assign Services"}
              </SectionTitle>

              <ServicesMultiSelect
                isRTL={isRTL}
                items={allServices}
                selectedIds={selectedServiceIds}
                onChange={setSelectedServiceIds}
                disabled={servicesSaving}
              />

              {servicesError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border-[0.1px] border-red-100 bg-red-50 p-3 text-[13px] font-bold text-red-600">
                  <AlertCircle size={16} /> {servicesError}
                </div>
              )}

              {successMsg && activeTab === "services" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-xl border-[0.1px] border-green-100 bg-green-50 px-4 py-3 text-[13px] font-bold text-green-700">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  {successMsg}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={saveServices}
                  disabled={!hasServicesChanges || servicesSaving}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#79A66B] font-bold text-white transition-colors hover:bg-[#6A955E] border-[0.1px] border-green-100 disabled:opacity-30 ${UI.primaryBtn}`}
                >
                  <Save size={16} />{" "}
                  {servicesSaving
                    ? "..."
                    : isRTL
                      ? "تحديث الخدمات"
                      : "Update Services"}
                </button>
                <button
                  onClick={() => setSelectedServiceIds(originalServiceIds)}
                  disabled={!hasServicesChanges || servicesSaving}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-[0.1px] border-gray-100 bg-white font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 ${UI.ghostBtn}`}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
