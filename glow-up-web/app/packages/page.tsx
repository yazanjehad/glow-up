"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import CategoryTabs from "@/components/services/CategoryTabs";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { useBookingStore } from "@/store/bookingStore";
import { useRouter, useSearchParams } from "next/navigation";
import PackageCardsList from "@/components/packages/PackageCardsList";
import OrderSummaryPackagesCard from "@/components/packages/OrderSummaryPackagesCard";
import { ProviderPackagesService } from "@/integration/services/provider-packages/provider-packages.service";
import type { ProviderPackageUiItem } from "@/integration/services/provider-packages/provider-packages.types";

export default function PackagesPage() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams?.get("providerId");

  const selectedProviderID = useBookingStore((s) => s.selectedProviderID);
  const providerPackages = useBookingStore((s) => s.providerPackages);
  const setProviderPackages = useBookingStore((s) => s.setProviderPackages);
  const setSelectedProviderID = useBookingStore((s) => s.setSelectedProviderID);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showAllByCategory, setShowAllByCategory] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const id = providerId || selectedProviderID;
    if (!id) return;
    
    if (providerId && providerId !== selectedProviderID) {
      setSelectedProviderID(providerId);
    }

    if (providerPackages?.length) return;

    (async () => {
      try {
        const items = await ProviderPackagesService.getByProviderIdAsUi(id);
        setProviderPackages(items);
      } catch (e) {
        console.error("Failed to load provider packages", e);
        setProviderPackages([]);
      }
    })();
  }, [providerId, selectedProviderID, providerPackages?.length, setProviderPackages, setSelectedProviderID]);

  const items = useMemo(() => {
    return (providerPackages ?? []) as ProviderPackageUiItem[];
  }, [providerPackages]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((p) => String(p.categoires ?? "")));
    return Array.from(unique).filter(Boolean);
  }, [items]);

  useEffect(() => {
    if (!activeCategory && categories.length) setActiveCategory(categories[0]);
  }, [categories, activeCategory]);

  const safeActiveCategory = useMemo(() => {
    if (categories.includes(activeCategory)) return activeCategory;
    return categories[0] ?? "";
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (p) => String(p.categoires ?? "") === safeActiveCategory
    );
  }, [items, safeActiveCategory]);

  const showAll = showAllByCategory[safeActiveCategory] ?? false;
  const visibleCount = showAll ? filteredItems.length : 4;

  const onPay = () => {
    router.push("/payment-details?mode=package");
  };

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="h-full overflow-hidden flex flex-col"
      >
        <div className="w-full mx-auto max-w-[66rem]">
          <TopBar
            titleKey="packagesPage.allPackages"
            iconHref={`/salon/${providerId || selectedProviderID}`}
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
                    <PackageCardsList
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

              <OrderSummaryPackagesCard onPay={onPay} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
