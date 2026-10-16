"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import PrimaryButton from "@/components/shared/PrimaryButton";
import { useNavigationFlow } from "@/lib/useNavigationFlow";

import PackagesManager from "@/components/provider/packages/PackagesManager";
import type { ProviderPackageUI } from "@/components/provider/packages/PackageCard";

import { useProviderStore } from "@/store/providerStore";
import {
  ServiceProvider,
  buildServiceOptionsFromApi,
} from "@/integration/services/provider/providerService";
import type { ProviderPackageApiDto } from "@/integration/services/provider/provider.types";

export default function ProviderPackagesPage() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();

  const setProviderId = useProviderStore((s: any) => s.setProviderId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [serviceOptions, setServiceOptions] = useState<
    { _id: string; label: string }[]
  >([]);

  const [packagesUi, setPackagesUi] = useState<ProviderPackageUI[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const dto = await ServiceProvider.getMeRaw();

        if (dto?._id) {
          setProviderId(dto._id);
        }

        const opts = buildServiceOptionsFromApi(dto.services ?? []);
        if (mounted) setServiceOptions(opts);

        const packagesFromApi: ProviderPackageUI[] = (dto.packages ?? []).map(
          (p) => ({
            id: p._id || "",
            name: p.name,
            desc: p.desc,
            price: p.price,
            items: p.items.map((i) => ({
              serviceItemId: i.serviceItemId || (i as any)._id,
              quantity: i.quantity,
            })),
          })
        );

        if (mounted) {
          setPackagesUi(packagesFromApi);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            t("provider.providerPackages.loadFailed")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [t, setProviderId]);

  const onNext = async () => {
    try {
      setSaving(true);
      setError("");

      const filteredPackages: ProviderPackageApiDto[] = packagesUi
        .filter(
          (p) =>
            p.items?.length > 0 &&
            p.items.every((i) => i.serviceItemId && i.quantity > 0)
        )
        .map((p) => {
          const isTemp = p.id && p.id.includes("-");
          return {
            ...(isTemp ? {} : { _id: p.id }),
            name: p.name,
            desc: p.desc ?? "",
            price: Number(p.price) || 0,
            items: p.items.map((x) => ({
              serviceItemId: x.serviceItemId,
              quantity: Number(x.quantity) || 1,
            })),
          };
        });

      await ServiceProvider.updatePackages(filteredPackages);

      nav.goToProviderUploadImages();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          t("provider.providerPackages.saveFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full max-w-[420px] mx-auto">
      <HeaderProvider
        titleKey="provider.packages.title"
        subtitleKey="provider.packages.subtitle"
      />

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && serviceOptions.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("provider.providerPackages.noServices")}
        </div>
      ) : null}

      <div className="mt-6">
        <PackagesManager
          initialPackages={packagesUi}
          serviceOptions={serviceOptions}
          onChange={setPackagesUi}
        />
      </div>

      <PrimaryButton
        className="mt-6"
        onClick={onNext}
        disabled={loading || saving}
      >
        {loading
          ? t("provider.providerPackages.loading")
          : saving
          ? t("provider.providerPackages.saving")
          : t("provider.providerPackages.next")}
      </PrimaryButton>

      <button
        type="button"
        onClick={() => nav.goToProviderUploadImages()}
        className="mt-3 w-full text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        {t("provider.providerPackages.skip")}
      </button>
    </div>
  );
}