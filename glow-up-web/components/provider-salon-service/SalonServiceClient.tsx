"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import HeaderProvider from "../shared/provider/HeaderProvider";
import PrimaryButton from "@/components/shared/PrimaryButton";

import ServiceCard from "./ServiceCard";
import ServiceDialog from "./ServiceDialog";
import type { ProviderService } from "@/app/models/provider-service-types";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";

export default function SalonServiceClient() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();
  const { services, addService, updateService, removeService } =
    useProviderStore();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<ProviderService | null>(null);

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
    const exists = services.some((x) => x.id === s.id);
    if (exists) {
      updateService(s);
    } else {
      addService(s);
    }
    setOpen(false);
  };

  const onDelete = () => {
    if (!selected) return;
    removeService(selected.id);
    setOpen(false);
  };
  const goNext = () => {
    nav.goToProviderPackages();
  };
  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <HeaderProvider
        titleKey="provider.service.title"
        subtitleKey="provider.service.desc"
      />

      <div className="mt-6 space-y-3">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} onClick={() => openEdit(s)} />
        ))}
      </div>

      <button
        onClick={openCreate}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50"
      >
        <Plus className="h-5 w-5" />
        {t("provider.service.addNew")}
      </button>

      <PrimaryButton className="mt-3" onClick={goNext}>
        {t("provider.service.next")}
      </PrimaryButton>

      <ServiceDialog
        open={open}
        mode={mode}
        initial={selected}
        onClose={() => setOpen(false)}
        onApply={onApply}
        onDelete={mode === "edit" ? onDelete : undefined}
      />
    </div>
  );
}
