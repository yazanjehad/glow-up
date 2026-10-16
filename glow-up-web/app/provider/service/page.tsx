"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import HeaderProvider from "../../../components/shared/provider/HeaderProvider";
import PrimaryButton from "@/components/shared/PrimaryButton";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import ServicesManager from "../../../components/provider/service";

import { useProviderStore } from "@/store/providerStore";
import { createProviderService } from "@/integration/services/provider/createProvider.service";
import { useLookupsStore } from "@/store/lookupsStore";

export default function SalonServiceClient() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const getAllData = useProviderStore((s: any) => s.getAllData);
  const lookups = useLookupsStore((s) => s.items);

  const onNext = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setError("");

      const data = getAllData();

      await createProviderService(data, lookups);

      try {
        const { ServiceProvider } = await import("@/integration/services/provider/providerService");

        const updatedSalon = await ServiceProvider.getMeRaw();

        if (updatedSalon && updatedSalon.services) {
          const { mapProviderServicesToUiItems } = await import(
            "@/integration/services/provider/provider.types"
          );

          const uiServices = mapProviderServicesToUiItems(
            updatedSalon.services
          );

          useProviderStore.getState().setServices(uiServices as any);
        }
      } catch (err) {
        console.error("Failed to sync updated services IDs", err);
      }

      nav.goToProviderPackages();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "فشل حفظ الخدمات"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full max-w-[420px] mx-auto">
      <HeaderProvider
        titleKey="admin-dashboard.serviceTitle"
        subtitleKey="admin-dashboard.serviceDesc"
      />

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        <ServicesManager />
      </div>

      <PrimaryButton
        className="mt-6"
        onClick={onNext}
        disabled={saving}
      >
        {saving ? "جاري الحفظ..." : t("admin-dashboard.serviceNext")}
      </PrimaryButton>
    </div>
  );
}