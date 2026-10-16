"use client";

import React from "react";
import { X, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next"; 
import PackageForm, { type PackageFormValues } from "./PackageForm";

type PackageMode = "create" | "edit";

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-[540px] flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PackageDialog({
  open,
  mode,
  initial,
  onClose,
  onApply,
  onDelete,
  serviceOptions,
}: {
  open: boolean;
  mode: PackageMode;
  initial: PackageFormValues | null;
  onClose: () => void;
  onApply: (v: PackageFormValues) => void;
  onDelete?: () => void;
  serviceOptions: { _id: string; label: string }[];
}) {
  const { t } = useTranslation(); // 2. استدعاء Hook الترجمة

  return (
    <Modal
      open={open}
      // 3. استخدام t() للنصوص
      title={
        mode === "create"
          ? t("provider.providerPackages.newPackage")
          : initial?.name || t("provider.providerPackages.editPackage")
      }
      onClose={onClose}
    >
      <div className="space-y-5">
        {mode === "edit" && onDelete ? (
          <div className="flex justify-end">
            {/* <button
              onClick={onDelete}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t("provider.providerPackages.deletePackage")}
            </button> */}
          </div>
        ) : null}

        <PackageForm
          initialValues={initial || undefined}
          serviceOptions={serviceOptions}
          onSubmit={onApply}
          submitLabel={
            mode === "create"
              ? t("save")
              : t("providerPackages.update")
          }
          primaryColor="#7AA66A"
        />
      </div>
    </Modal>
  );
}