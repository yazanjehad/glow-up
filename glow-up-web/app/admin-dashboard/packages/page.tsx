"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import PrimaryButton from "@/components/shared/PrimaryButton";
import PackagesManager from "@/components/provider/packages/PackagesManager";
import type { ProviderPackageUI } from "@/components/provider/packages/PackageCard";

import { useProviderStore } from "@/store/providerStore";
import {
  ServiceProvider,
  buildServiceOptionsFromApi,
} from "@/integration/services/provider/providerService";

import type {
  ProviderPackageApiDto,
  SalonApiDto,
} from "@/integration/services/provider/provider.types";


function mapApiPackagesToUi(dto: SalonApiDto): ProviderPackageUI[] {
  const pkgs = dto.packages ?? [];
  return pkgs.map((p: any) => ({
    id: p._id || p.id,
    name: p.name || "",
    desc: p.desc ?? "",
    price: Number(p.price) || 0,
    items: (p.items ?? []).map((x: any) => ({
      serviceItemId: x.serviceItemId || x._id,
      quantity: Number(x.quantity) || 1,
    })),
  }));
}

function mapUiToApiPayload(
  packagesUi: ProviderPackageUI[],
): ProviderPackageApiDto[] {
  return packagesUi
    .map((p) => ({
      _id: p.id?.startsWith("temp-") ? undefined : p.id,
      name: (p.name || "").trim(),
      desc: (p.desc || "").trim(),
      price: Number(p.price) || 0,
      items: (p.items ?? [])
        .filter((x) => x.serviceItemId && Number(x.quantity) > 0)
        .map((x) => ({
          serviceItemId: x.serviceItemId,
          quantity: Number(x.quantity) || 1,
        })),
    }))
    .filter((p) => p.name && p.items.length > 0) as any;
}

export default function AdminDashboardPackagesPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const providerIdFromStore = useProviderStore((s: any) => s.providerId) as
    | string
    | undefined;

  const [providerId, setProviderId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [serviceOptions, setServiceOptions] = useState<
    { _id: string; label: string }[]
  >([]);
  const [packagesUi, setPackagesUi] = useState<ProviderPackageUI[]>([]);
  const [originalPackages, setOriginalPackages] = useState<ProviderPackageUI[]>(
    [],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const id =
          (providerIdFromStore || "").trim() ||
          (localStorage.getItem("providerId") || "").trim();

        if (!id) {
          if (!mounted) return;
          setProviderId("");
          return;
        }

        const dto = await ServiceProvider.getMeRaw();
        const opts = buildServiceOptionsFromApi(dto.services ?? []);
        const pkgs = mapApiPackagesToUi(dto);

        if (mounted) {
          setProviderId(id);
          setServiceOptions(opts);
          setPackagesUi(pkgs);
          setOriginalPackages(pkgs);
        }
      } catch (e: any) {
        if (mounted) {
          setError(
            e?.response?.data?.message || e?.message || "فشل تحميل البيانات",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [providerIdFromStore]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(packagesUi) !== JSON.stringify(originalPackages);
  }, [packagesUi, originalPackages]);

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!providerId) throw new Error("Missing providerId");

      const payload = mapUiToApiPayload(packagesUi);
      await ServiceProvider.updatePackages(payload, providerId);

      const fresh = await ServiceProvider.getMeRaw();
      const freshPkgs = mapApiPackagesToUi(fresh);

      setPackagesUi(freshPkgs);
      setOriginalPackages(freshPkgs);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "فشل حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPackagesUi(originalPackages);
    setError("");
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="p-6 animate-in fade-in duration-500"
    >
      <header className="mb-8 px-1">
        <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">
          {t("provider.sidebar.packages")}
        </h2>
        <p className="text-[13px] text-gray-400 mt-1">
          {isRTL
            ? "إدارة باقات الخدمات والعروض الخاصة بك"
            : "Manage your service packages and special offers"}
        </p>
      </header>

      <div className="bg-white rounded-[28px] border border-gray-100/80 shadow-[0_2px_12px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-2">
          <div className="bg-gray-50/40 rounded-[24px] p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400 animate-pulse">
                {t("loading") || "Loading..."}
              </div>
            ) : serviceOptions.length === 0 ? (
              <div className="text-center py-6 text-sm text-amber-600 bg-amber-50/50 rounded-xl px-4">
                {isRTL
                  ? "لا توجد خدمات متاحة حالياً. يرجى إضافة الخدمات أولاً."
                  : "No services available. Please add services first."}
              </div>
            ) : (
              <PackagesManager
                key={JSON.stringify(originalPackages)} 
                initialPackages={packagesUi}
                serviceOptions={serviceOptions}
                onChange={setPackagesUi}
              />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[16px] bg-white p-4 border border-red-100">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <footer className="mt-10 px-2 space-y-3">
        <PrimaryButton
          className="w-full shadow-sm"
          onClick={onSave}
          disabled={saving || loading || !hasChanges}
        >
          {saving ? t("admin-dashboard.saving") : t("admin-dashboard.saveChanges")}
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