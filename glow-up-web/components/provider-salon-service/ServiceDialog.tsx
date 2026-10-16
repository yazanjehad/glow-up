"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SaudiRiyal, Loader2, X, PlusCircle } from "lucide-react";
import type { ProviderService } from "@/app/models/provider-service-types";
import { useLookupsStore } from "@/store/lookupsStore";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";
import { LookupsService } from "@/integration/services/provider/lookupsService";

type ProviderServiceMode = "create" | "edit";

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
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
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

export default function ServiceDialog({
  open,
  mode,
  initial,
  onClose,
  onApply,
  onDelete,
  loadingLookups,
  lookupsError,
}: {
  open: boolean;
  mode: ProviderServiceMode;
  initial: ProviderService | null;
  onClose: () => void;
  onApply: (s: ProviderService) => void;
  onDelete?: () => void;
  loadingLookups?: boolean;
  lookupsError?: string;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = isRTL ? "ar" : "en";

  const items = useLookupsStore((s) => s.items);
  const setStoreItems = (newItems: any) =>
    useLookupsStore.setState({ items: newItems });

  const categoryOptions = useMemo(
    () =>
      items.filter((x) => x.key === "SERVICE_CATEGORY" && x.isActive !== false),
    [items],
  );

  const typeOptions = useMemo(
    () => items.filter((x) => x.key === "SERVICE_TYPE" && x.isActive !== false),
    [items],
  );

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [price, setPrice] = useState("");

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatAr, setNewCatAr] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatArError, setNewCatArError] = useState("");
  const [newCatEnError, setNewCatEnError] = useState("");
  const [createCatError, setCreateCatError] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setCategoryId(initial?.categoryId ?? "");
    setTypeId(initial?.typeId ?? "");
    setHours(initial ? Math.floor((initial.durationMinutes || 0) / 60) : 0);
    setMinutes(initial ? (initial.durationMinutes || 0) % 60 : 30);
    setPrice(initial ? String(initial.price ?? "") : "");
    setShowNewCategory(false);
    setNewCatAr("");
    setNewCatEn("");
    setNewCatArError("");
    setNewCatEnError("");
    setCreateCatError("");
  }, [open, initial]);

  const categoryLabel = useMemo(() => {
    const obj = categoryOptions.find((x) => x._id === categoryId);
    return pickLocalized(obj?.name, lang) || "";
  }, [categoryOptions, categoryId, lang]);

  const typeLabel = useMemo(() => {
    const obj = typeOptions.find((x) => x._id === typeId);
    return pickLocalized(obj?.name, lang) || "";
  }, [typeOptions, typeId, lang]);

  const canApply =
    !isCreatingCategory &&
    name.trim().length > 0 &&
    (showNewCategory
      ? newCatAr.trim().length > 0 && newCatEn.trim().length > 0
      : categoryId.trim().length > 0) &&
    typeId.trim().length > 0 &&
    (hours > 0 || minutes > 0) &&
    Number(price) > 0;

  const handleApply = async () => {
    if (!canApply) return;
    let finalCategoryId = categoryId;
    let finalCategoryLabel = categoryLabel;

    try {
      if (showNewCategory) {
        setIsCreatingCategory(true);

        const createdCat = await LookupsService.createCategory({
          code: newCatEn.trim(),
          name: {
            en: newCatEn.trim(),
            ar: newCatAr.trim(),
          },
          isActive: true,
        });

        setStoreItems([...items, createdCat]);
        finalCategoryId = createdCat._id;
        finalCategoryLabel = pickLocalized(createdCat.name, lang);
      }

      const durationMinutes = hours * 60 + minutes;
      onApply({
        id: initial?.id ?? crypto.randomUUID(),
        name: name.trim(),
        categoryId: finalCategoryId,
        categoryLabel: finalCategoryLabel || undefined,
        typeId,
        typeLabel: typeLabel || undefined,
        durationMinutes,
        price: Number(price),
        isActive: initial?.isActive ?? false,
      });
    } catch (error) {
      console.error("Failed to create category:", error);
      setCreateCatError(
        isRTL ? "هذا الاسم موجود مسبقا " : "This name is already exists",
      );
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        mode === "create"
          ? t("provider.services.dialog.addTitle")
          : (initial?.name ?? t("provider.services.dialog.editTitle"))
      }
      onClose={onClose}
    >
      {loadingLookups ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#7AA66A]" />
          <span className="text-sm text-gray-500">{t("loading")}</span>
        </div>
      ) : lookupsError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {lookupsError}
        </div>
      ) : (
        <div className="space-y-5">
          {mode === "edit" && onDelete && (
            <div className="flex justify-end">
              {/* <button
                onClick={onDelete}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {isRTL ? "حذف هذه الخدمة" : "Delete this service"}
              </button> */}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {t("provider.services.dialog.nameLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#7AA66A] focus:ring-4 focus:ring-[#7AA66A]/5 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {isRTL ? "التصنيف" : "Category"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={showNewCategory ? "__add_new__" : categoryId}
              onChange={(e) => {
                if (e.target.value === "__add_new__") {
                  setCategoryId("");
                  setShowNewCategory(true);
                } else {
                  setCategoryId(e.target.value);
                  setShowNewCategory(false);
                }
              }}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#7AA66A]"
            >
              <option value="">
                {isRTL ? "اختر التصنيف" : "Select category"}
              </option>
              {categoryOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {pickLocalized(opt.name, lang) || opt.code}
                </option>
              ))}
              <option value="__add_new__" className="font-bold text-[#7AA66A]">
                + {isRTL ? "تصنيف جديد..." : "New category..."}
              </option>
            </select>
          </div>

          {showNewCategory && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#7AA66A]/20 bg-[#7AA66A]/5 p-4 animate-in fade-in slide-in-from-top-2">
              {createCatError && (
                <div className="mb-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 animate-in shake">
                  {createCatError}
                </div>
              )}
              <div className="flex items-center gap-2 mb-1 text-[#7AA66A]">
                <PlusCircle className="h-4 w-4" />
                <span className="text-xs font-bold">
                  {isRTL ? "إضافة تصنيف جديد" : "Add New Category"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  {newCatArError && (
                    <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-bottom-1">
                      {newCatArError}
                    </span>
                  )}
                  <input
                    value={newCatAr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/[^\u0600-\u06FF\s]/.test(val)) {
                        setNewCatArError(isRTL ? "أحرف عربية فقط" : "Arabic only");
                      } else {
                        setNewCatArError("");
                      }
                      setNewCatAr(val.replace(/[^\u0600-\u06FF\s]/g, ""));
                    }}
                    placeholder="الاسم بالعربي"
                    dir="rtl"
                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#7AA66A] bg-white w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {newCatEnError && (
                    <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-bottom-1">
                      {newCatEnError}
                    </span>
                  )}
                  <input
                    value={newCatEn}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/[^a-zA-Z\s]/.test(val)) {
                        setNewCatEnError(t("englishOnly"));
                      } else {
                        setNewCatEnError("");
                      }
                      setNewCatEn(val.replace(/[^a-zA-Z\s]/g, ""));
                    }}
                    placeholder="Name in English"
                    dir="ltr"
                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#7AA66A] bg-white w-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {t("provider.services.dialog.typeLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#7AA66A]"
            >
              <option value="">
                {t("provider.services.dialog.typePlaceholder")}
              </option>
              {typeOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {pickLocalized(opt.name, lang) || opt.code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {isRTL ? "السعر" : "Price"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 focus-within:border-[#7AA66A] focus-within:ring-4 focus-within:ring-[#7AA66A]/5 transition-all">
                <SaudiRiyal className="h-4 w-4 text-gray-400" />
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  placeholder="0.00"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                {isRTL ? "المدة" : "Duration"}
              </label>
              <div className="flex gap-2">
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="h-11 flex-1 rounded-xl border border-gray-200 px-2 text-sm outline-none focus:border-[#7AA66A]"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} {isRTL ? "ساعة" : "h"}
                    </option>
                  ))}
                </select>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="h-11 flex-1 rounded-xl border border-gray-200 px-2 text-sm outline-none focus:border-[#7AA66A]"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {m} {isRTL ? "دقيقة" : "m"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApply}
              disabled={!canApply || isCreatingCategory}
              className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${canApply
                  ? "bg-[#7AA66A] text-white hover:bg-[#6a915c]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                }`}
            >
              {isCreatingCategory ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("provider.commons.apply")
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
