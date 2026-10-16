"use client";

import { Package } from "lucide-react";

type PackageItem = { serviceItemId: string; quantity: number };

export type ProviderPackageUI = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  items: PackageItem[];
};

export default function PackageCard({
  pkg,
  onClick,
}: {
  pkg: ProviderPackageUI;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-400">
          <Package className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate font-semibold text-gray-900">
              {pkg.name}
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {pkg.price}
            </div>
          </div>

          {pkg.desc ? (
            <div className="mt-1 text-sm text-gray-600 line-clamp-2">
              {pkg.desc}
            </div>
          ) : null}

          <div className="mt-2 text-xs text-gray-500">
            العناصر:{" "}
            <span className="font-semibold">{pkg.items?.length || 0}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
