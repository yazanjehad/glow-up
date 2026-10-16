"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TrashIcon from "@/components/ui/trachIcon";
import { SaudiRiyal } from "lucide-react";
import { usePackagesStore } from "@/store/packageStore";
import { useBookingStore } from "@/store/bookingStore";
import type { ProviderPackageUiItem } from "@/app/models/packages-type";

type OrderItem = {
  id: string;
  title: string;
  price: number;
};

type Props = {
  onPay: () => void;
};

export default function OrderSummaryPackagesCard({ onPay }: Props) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  const unSelect = usePackagesStore((s) => s.unSelectPackageID);
  const packageIDs = usePackagesStore((s) => s.packageIDs);
  const setSelectedPackageID = usePackagesStore((s) => s.setSelectedPackageID);

  const providerPackages = useBookingStore((s) => s.providerPackages);

  const CallOnPay = () => {
    if (!packageIDs.length) return;
    setSelectedPackageID(packageIDs[0]); 
    onPay();
  };

  const getItems = useCallback((): OrderItem[] => {
    const list: ProviderPackageUiItem[] = Array.isArray(providerPackages)
      ? providerPackages
      : [];

    return list
      .filter((p) => packageIDs.includes(String(p.id)))
      .map((p) => ({
        id: String(p.id),
        title: p.name ?? "Package",
        price: Number(p.price) || 0,
      }));
  }, [providerPackages, packageIDs]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted) setItems(getItems());
  }, [getItems, mounted]);

  useEffect(() => {
    setTotal(items.reduce((sum, it) => sum + (Number(it.price) || 0), 0));
  }, [items]);

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-4 lg:top-4 h-fit">
      <h3 className="text-sm font-semibold text-neutral-800">
        {t("serviceDetails.orderDetails")}
      </h3>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
            {t("serviceDetails.emptyOrder")}
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 p-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => unSelect(it.id)}
                  className="grid place-items-center rounded-md p-1 text-red-500 hover:bg-red-50 flex-shrink-0"
                  aria-label={t("serviceDetails.delete")}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

                <p className="text-sm font-medium text-neutral-800 truncate">
                  {it.title}
                </p>
              </div>

              <div className="flex items-center gap-1 text-sm font-semibold text-neutral-800 whitespace-nowrap">
                <span>{it.price}</span>
                <SaudiRiyal size={18} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
        <span className="text-sm text-neutral-500">
          {t("serviceDetails.total")}
        </span>
        <div className="flex items-center gap-1 text-base font-extrabold text-neutral-900">
          <span>{total}</span>
          <SaudiRiyal size={18} />
        </div>
      </div>

      <button
        type="button"
        onClick={CallOnPay}
        disabled={packageIDs.length === 0}
        className={[
          "mt-3 w-full rounded-lg py-2.5 text-sm font-semibold transition",
          packageIDs.length === 0
            ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
            : "bg-[#7BAE6A] text-white hover:opacity-90",
        ].join(" ")}
      >
        {t("serviceDetails.goToPay")}
      </button>
    </div>
  );
}
