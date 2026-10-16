"use client";

import { useMemo } from "react";
import Image from "next/image";
import { SaudiRiyal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePackagesStore } from "@/store/packageStore";
import { useBookingStore } from "@/store/bookingStore";
import type { ProviderPackageUiItem } from "@/app/models/packages-type";

type Props = {
  visibleCount: number;
  activeCategory: string;
  /** When false, cards are view-only (no selection checkmark or click-to-select). Default true. */
  selectable?: boolean;
};

const EMPTY_IDS: string[] = [];

export default function PackageCardsList({
  visibleCount,
  activeCategory,
  selectable = true,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const toggleSelect = usePackagesStore((s) => s.togglePackageID);
  const setSelectedPackageID = usePackagesStore((s) => s.setSelectedPackageID);
  const selectedIds = usePackagesStore((s) => s.packageIDs ?? EMPTY_IDS);

  const providerPackages = useBookingStore((s) => s.providerPackages);

  const setSelectedServiceID = useBookingStore((s) => s.setSelectedServiceID);

  const visibleItems = useMemo(() => {
    const list: ProviderPackageUiItem[] = Array.isArray(providerPackages)
      ? providerPackages
      : [];

    const filtered = list.filter(
      (x) => String(x.categoires ?? "") === String(activeCategory ?? "")
    );

    return filtered.slice(0, visibleCount);
  }, [providerPackages, activeCategory, visibleCount]);

  return (
    <div className="mt-3">
      <div className="service-scroll max-h-[380px] overflow-y-auto space-y-2 rounded-2xl bg-white border-neutral-200 p-3 shadow-sm">
        {visibleItems.length === 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
            {isRTL ? "لا يوجد باقات" : "No packages available"}
          </div>
        )}

        {visibleItems.map((item) => {
          const id = String(item.id);
          const title =
            (typeof item.name === "string" && item.name) ||
            t("packagesPage.packageFallback", { defaultValue: "Package" });

          const description = typeof item.description === "string" ? item.description : "";
          const price = Number(item.price ?? 0);
          const isSelected = selectable && selectedIds.includes(id);

          const cardContent = (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-start">
                <div className="truncate font-semibold text-neutral-900 text-sm">
                  {title}
                </div>

                {description ? (
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500">
                    {description}
                  </div>
                ) : null}

                <div className="mt-0.5 flex items-center gap-1 text-xs">
                  <span className="font-semibold text-neutral-700">
                    {price}
                  </span>
                  <SaudiRiyal size={18} />
                </div>
              </div>

              {selectable && (
                <span className="flex items-center justify-center h-8 w-8">
                  <Image
                    src={isSelected ? "/check.png" : "/add.png"}
                    alt="icon"
                    width={22}
                    height={22}
                  />
                </span>
              )}
            </div>
          );

          const baseClass = [
            "w-full rounded-xl border bg-white transition-all",
            "px-3 py-2",
            "shadow-sm",
            selectable ? "hover:shadow-md" : "",
            isSelected
              ? "border-[#7BAE6A] bg-emerald-50/40"
              : "border-neutral-200",
            selectable ? "hover:bg-neutral-50" : "",
          ].join(" ");

          return selectable ? (
            <button
              key={id}
              type="button"
              onClick={() => {
                toggleSelect(id);
                setSelectedPackageID(id);
                const firstServiceId = item.servicesIds?.[0];
                if (firstServiceId) {
                  setSelectedServiceID(String(firstServiceId));
                }
              }}
              className={baseClass}
            >
              {cardContent}
            </button>
          ) : (
            <div key={id} className={baseClass}>
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
