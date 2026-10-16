"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import ServiceCard from "../provider-salon-service/ServiceCard";
import ServiceDialog from "../provider-salon-service/ServiceDialog";
import { useProviderStore } from "@/store/providerStore";
import type { ProviderService } from "@/app/models/provider-service-types";
import { useLookupsStore } from "@/store/lookupsStore";

export default function ServicesManager() {
  const { t } = useTranslation();

  const toggleServiceActive = useProviderStore((s) => s.toggleServiceActive);
  const { services, addService, updateService, removeService } =
    useProviderStore();

  const loadAll = useLookupsStore((s) => s.loadAll);
  const lookupsLoading = useLookupsStore((s) => s.loading);
  const lookupsError = useLookupsStore((s) => s.error);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<ProviderService | null>(null);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreate = () => {
    setSelected(null);
    setMode("create");
    setOpen(true);
  };

  const openEdit = (s: ProviderService) => {
    setSelected(s);
    setMode("edit");
    setOpen(true);
  };

  const onApply = (s: ProviderService) => {
    if (mode === "edit" && selected) {
      const updatedService = { ...s, id: selected.id };
      updateService(updatedService);
      setOpen(false);
      return;
    }

    addService(s);
    setOpen(false);
  };

  const onDelete = () => {
    if (!selected) return;
    removeService(selected.id);
    setOpen(false);
  };

  const list = useMemo(() => services || [], [services]);

  return (
    <>
      <div className="space-y-3">
        {list.map((s) => (
          <ServiceCard
            key={s.id}
            service={s}
            onClick={() => openEdit(s)}
            onToggleActive={(id, active) => toggleServiceActive(id, active)}
          />
        ))}
      </div>

      <button
        onClick={openCreate}
        className="mt-4 sm:mt-5 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-5 w-5" />
        {t("admin-dashboard.serviceAddNew")}
      </button>

      <ServiceDialog
        open={open}
        mode={mode}
        initial={selected}
        onClose={() => setOpen(false)}
        onApply={onApply}
        onDelete={mode === "edit" ? onDelete : undefined}
        loadingLookups={lookupsLoading}
        lookupsError={lookupsError}
      />
    </>
  );
}