"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import CategoryTabs from "@/components/services/CategoryTabs";
import ServiceCardsList from "@/components/services/ServiceCardsList";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/shared/TopBar";
import OrderSummaryCard from "@/components/services/OrderSummaryCard";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { useBookingStore } from "@/store/bookingStore";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { ProviderServiceUiItem } from "../../integration/services/provider/provider.types";
import { useRouter } from "next/navigation";
export default function ServicesPage() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");
  const router = useRouter();
  const { selectedProviderID, providerServices, setProviderServices, hasHydrated } = useBookingStore();

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showAllByCategory, setShowAllByCategory] = useState<
    Record<string, boolean>
  >({});

  // Redirect to home if no provider selected (e.g., page refresh)
  useEffect(() => {
    if (hasHydrated && !selectedProviderID) {
      router.replace("/home");
    }
  }, [selectedProviderID, router, hasHydrated]);

  useEffect(() => {
    if (!selectedProviderID) return;
    if (providerServices?.length) return;

    (async () => {
      try {
        const items =
          await ServiceProvider.getServicesItems(selectedProviderID);
        setProviderServices(items);
      } catch (e) {
        console.error("Failed to load provider services", e);
        setProviderServices([]);
      }
    })();
  }, [selectedProviderID, providerServices?.length, setProviderServices]);

  const items = useMemo(() => {
    return (providerServices ?? []) as any as ProviderServiceUiItem[];
  }, [providerServices]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((s: any) => String(s?.category ?? s?.categoryLabel ?? "")));
    return Array.from(unique).filter(Boolean);
  }, [items]);

  const safeActiveCategory = useMemo(() => {
    if (categories.includes(activeCategory)) return activeCategory;
    return categories[0] ?? "";
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (s: any) => String((s as any).category ?? (s as any).categoryLabel) === safeActiveCategory,
    );
  }, [items, safeActiveCategory]);

  const showAll = showAllByCategory[safeActiveCategory] ?? false;
  const visibleCount = showAll ? filteredItems.length : 4;

  const onPay = () => {
    router.push("/booking-for?id=" + selectedProviderID);
  };

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="h-full overflow-hidden flex flex-col"
      >
        <div className="w-full mx-auto max-w-[66rem]">
          <TopBar
            titleKey="servicePage.services"
            iconHref={`/salon/${selectedProviderID}`}
            iconAriaLabelKey="reviewsPage.backAria"
            icon={<ChevronArrow />}
          />
        </div>

        <div className="flex-1 overflow-hidden px-4 py-4">
          <div className="mx-auto max-w-5xl h-full">
            <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr]">
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex flex-col overflow-hidden">
                <div className="px-4 py-3 shrink-0">
                  <CategoryTabs
                    categories={categories}
                    active={safeActiveCategory}
                    onChange={setActiveCategory}
                  />
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
                    <ServiceCardsList
                      visibleCount={visibleCount}
                      activeCategory={safeActiveCategory}
                    />
                  </div>

                  {filteredItems.length > 4 && (
                    <div className="shrink-0 px-4 pb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllByCategory((prev) => ({
                            ...prev,
                            [safeActiveCategory]: !showAll,
                          }))
                        }
                        className="w-full rounded-xl border border-[#7BAE6A] bg-white px-3 py-2 text-sm font-semibold text-[#7BAE6A] hover:bg-[#7BAE6A]/10"
                      >
                        {showAll ? t("showLess") : t("showAll")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <OrderSummaryCard onPay={onPay} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
