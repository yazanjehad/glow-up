"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ServicesManager from "../../../components/provider/service";
import PrimaryButton from "@/components/shared/PrimaryButton";

import { ServiceProvider } from "@/integration/services/provider/providerService";
import { useProviderStore } from "@/store/providerStore";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

type UiServiceItem = {
  id: string;
  categoryId: string;
  typeId: string;
  name: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

function buildServicesPayload(items: UiServiceItem[]) {
  const byCat = new Map<string, UiServiceItem[]>();

  for (const it of items || []) {
    const catId = String(it.categoryId || "").trim();
    if (!catId) continue;

    const arr = byCat.get(catId) ?? [];
    arr.push(it);
    byCat.set(catId, arr);
  }

  return Array.from(byCat.entries()).map(([category, arr]) => ({
    category,
    items: arr
      .filter((x) => String(x.typeId || "").trim())
      .map((x) => ({
        ...(x.id && x.id.length === 24 ? { _id: x.id } : {}),
        type: String(x.typeId).trim(),
        name: String(x.name || "").trim(),
        price: Number(x.price || 0),
        durationMinutes: Number(x.durationMinutes || 0),
        isActive: typeof x.isActive === "boolean" ? x.isActive : false,
      })),
  }));
}

export default function UpdateServicesPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const { setServices } = useProviderStore();
  const services = useProviderStore((s: any) => s.services) as UiServiceItem[];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [original, setOriginal] = useState<UiServiceItem[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const providerId = localStorage.getItem("providerId") || "";
        if (!providerId.trim()) throw new Error("Missing providerId");

        const dto = await ServiceProvider.getMeRaw();

        const apiServices = dto.services ?? [];
        const mapped = (apiServices ?? []).flatMap((cat: any) =>
          (cat.items ?? []).map((item: any) => ({
            id: String(item?._id ?? ""),
            categoryId: String(cat?.category?._id ?? cat?.category ?? ""),
            typeId: String(item?.type?._id ?? item?.type ?? ""),
            name: String(item?.name ?? ""),
            durationMinutes: Number(item?.durationMinutes ?? 0),
            price: Number(item?.price ?? 0),
            isActive:
              typeof item?.isActive === "boolean" ? item.isActive : false,
          })),
        );

        if (alive) {
          setServices(mapped);
          setOriginal(mapped);
        }
      } catch (e) {
        console.error("Failed to load services", e);
        if (alive) {
          setServices([]);
          setOriginal([]);
          setError("Failed to load services");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [setServices]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(services || []) !== JSON.stringify(original || []);
  }, [services, original]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!hasChanges) return;

      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) throw new Error("Missing providerId");

      const servicesPayload = buildServicesPayload(services || []);

      await patch(
        `/providers/${providerId}`,
        { services: servicesPayload },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      // Reload from API to get real MongoDB _ids — prevents duplication on next save
      const freshDto = await ServiceProvider.getMeRaw();
      const freshMapped = (freshDto.services ?? []).flatMap((cat: any) =>
        (cat.items ?? []).map((item: any) => ({
          id: String(item?._id ?? ""),
          categoryId: String(cat?.category?._id ?? cat?.category ?? ""),
          typeId: String(item?.type?._id ?? item?.type ?? ""),
          name: String(item?.name ?? ""),
          durationMinutes: Number(item?.durationMinutes ?? 0),
          price: Number(item?.price ?? 0),
          isActive: typeof item?.isActive === "boolean" ? item.isActive : false,
        })),
      );
      setServices(freshMapped);
      setOriginal(freshMapped);
    } catch (e: any) {
      // عرض رسالة الخطأ فقط من API
      if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError(e?.message || "Failed to save services");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError("");
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="px-3 py-4 sm:p-6 animate-in fade-in duration-500"
    >
      <header className="mb-6 sm:mb-8 px-1">
        <h2 className="text-[18px] sm:text-[22px] font-semibold text-gray-900 tracking-tight">
          {t("admin-dashboard.servicesManagement")}
        </h2>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
          {isRTL
            ? "تعديل وإضافة الخدمات والأسعار"
            : "Update and manage your services"}
        </p>
      </header>

      <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-gray-100/80 shadow-[0_2px_12px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-2">
          <div className="bg-gray-50/40 rounded-[20px] sm:rounded-[24px] p-3 sm:p-6">
            {loading ? (
              <div className="text-center text-sm text-gray-500">
                {t("loading") || "Loading..."}
              </div>
            ) : (
              <ServicesManager />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[16px] bg-white p-4 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <footer className="mt-6 sm:mt-10 px-1 sm:px-2 space-y-3">
        <PrimaryButton
          className="w-full shadow-sm"
          onClick={handleSave as any}
          disabled={saving || loading || !hasChanges}
        >
          {saving
            ? t("admin-dashboard.saving")
            : t("admin-dashboard.saveChanges")}
        </PrimaryButton>

        <button
          onClick={handleCancel}
          disabled={saving || loading}
          className="w-full py-2 text-[14px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t("cancel")}
        </button>
      </footer>
    </div>
  );
}