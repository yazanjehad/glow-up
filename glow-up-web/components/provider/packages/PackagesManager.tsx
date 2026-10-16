"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import PackageDialog from "./PackageDialog";
import PackageCard, { type ProviderPackageUI } from "./PackageCard";
import type { PackageFormValues } from "./PackageForm";

let tempCounter = 0;
const createTempId = () => `temp-${++tempCounter}-${Date.now()}`;

export default function PackagesManager({
  initialPackages,
  serviceOptions,
  onChange,
}: {
  initialPackages?: ProviderPackageUI[];
  serviceOptions: { _id: string; label: string }[];
  onChange?: (next: ProviderPackageUI[]) => void;
}) {
  const [packages, setPackages] = useState<ProviderPackageUI[]>(
    initialPackages ?? [],
  );

  const initialized = useRef(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  useEffect(() => {
    if (!initialPackages) return;
    setPackages(initialPackages);
  }, [initialPackages]);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<ProviderPackageUI | null>(null);

  const openCreate = () => {
    setSelected(null);
    setMode("create");
    setOpen(true);
  };

  const openEdit = (p: ProviderPackageUI) => {
    setSelected(p);
    setMode("edit");
    setOpen(true);
  };

  const commit = (next: ProviderPackageUI[]) => {
    setPackages(next);
    onChange?.(next);
  };

  const onApply = (v: PackageFormValues) => {
    if (mode === "create") {
      const newPackage: ProviderPackageUI = {
        id: createTempId(),
        name: v.name,
        desc: v.desc,
        price: v.price,
        items: v.items,
      };

      commit([newPackage, ...packages]);
    } else {
      if (!selected) return;

      commit(
        packages.map((x) =>
          x.id === selected.id
            ? {
                ...x,
                name: v.name,
                desc: v.desc,
                price: v.price,
                items: v.items,
              }
            : x,
        ),
      );
    }

    setOpen(false);
  };

  const onDelete = () => {
    if (!selected) return;

    commit(packages.filter((x) => x.id !== selected.id));
    setOpen(false);
  };

  return (
    <>
      <div className="space-y-3">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} onClick={() => openEdit(p)} />
        ))}
      </div>

      <button
        onClick={openCreate}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-5 w-5" />
        {t("provider.providerPackages.newPackage")}
      </button>

      <PackageDialog
        open={open}
        mode={mode}
        initial={
          selected
            ? {
                name: selected.name,
                desc: selected.desc || "",
                price: selected.price,
                items: selected.items,
              }
            : null
        }
        onClose={() => setOpen(false)}
        onApply={onApply}
        onDelete={mode === "edit" ? onDelete : undefined}
        serviceOptions={serviceOptions}
      />
    </>
  );
}
