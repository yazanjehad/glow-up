"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Clock, SaudiRiyal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useServicesStore } from "@/store/serviceStore";
import { useBookingStore } from "@/store/bookingStore";
import { ServiceProvider } from "../../integration/services/provider/providerService";
import { ProviderServiceUiItem } from "../../integration/services/provider/provider.types";
type Props = {
  visibleCount: number;
  activeCategory: string;
  /** When false, cards are view-only (no selection checkmark or click-to-select). Default true. */
  selectable?: boolean;
};

const EMPTY_IDS: string[] = [];

export default function ServiceCardsList({
  visibleCount,
  activeCategory,
  selectable = true,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const toggleSelect = useServicesStore((s) => s.toggeleServiceID);
  const setSelectedServiceID = useServicesStore((s) => s.setSelectedServiceID);

  const selectedIds = useServicesStore((s) => s.servicesIDS ?? EMPTY_IDS);

  const [visibleItems, setVisibleItems] = useState<ProviderServiceUiItem[]>([]);

  const providerServices = useBookingStore((s) => s.providerServices);
  const setProviderServices = useBookingStore((s) => s.setProviderServices);
  const selectedProviderID = useBookingStore((s) => s.selectedProviderID);

  useEffect(() => {
    if (!selectedProviderID) return;

    (async () => {
      try {
        const items =
          await ServiceProvider.getServicesItems(selectedProviderID, i18n.language as any);
        setProviderServices(items);
      } catch (e) {
        console.error("Failed to load provider services", e);
        setProviderServices([]);
      }
    })();
  }, [selectedProviderID, setProviderServices, i18n.language]);

  useEffect(() => {
    const list = Array.isArray(providerServices) ? providerServices : [];
    const filtered = list.filter((x: any) => (x?.category ?? x?.categoryLabel) == activeCategory);
    setVisibleItems(filtered.slice(0, visibleCount) as any);
  }, [providerServices, visibleCount, activeCategory]);

  return (
    <div className="mt-3">
      <div className="service-scroll max-h-[380px] overflow-y-auto space-y-2 rounded-2xl bg-white border-neutral-200 p-3 shadow-sm">
        {visibleItems.length === 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
            {isRTL ? "لا يوجد خدمات" : "No services available"}
          </div>
        )}

        {visibleItems.map((item) => {
          const id = String((item as any).id ?? (item as any)._id);

          const title = t(`servicesList.${(item as any).name}`, {
            defaultValue:
              (item as any).title ??
              (item as any).serviceName ??
              (item as any).name ??
              "Service",
          });
          const description = (item as any).description;

          const price = (item as any).price ?? 0;
          const duration = (item as any).duration ?? 30;

          const isSelected = selectable && selectedIds.includes(id);

          const cardContent = (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-start">
                <div className="truncate font-semibold text-neutral-900 text-sm">
                  {title}
                </div>
                {item.category && (
                  <div className="text-[10px] text-neutral-400">
                    {item.category}
                  </div>
                )}
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

              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {duration} {t("durationUnit")}
                  </span>
                </span>

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
            </div>
          );

          const baseClass = [
            "w-full rounded-xl border bg-white transition-all",
            "px-3 py-2",
            "shadow-sm",
            selectable ? "hover:shadow-md" : "",
            isSelected
              ? "border-[#7BAE6A] bg-[#F1F5EF]"
              : "border-neutral-200",
            selectable ? "hover:bg-neutral-50" : "",
          ].join(" ");

          return selectable ? (
            <button
              key={id}
              type="button"
              onClick={() => {
                toggleSelect(id);
                setSelectedServiceID(id);
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
