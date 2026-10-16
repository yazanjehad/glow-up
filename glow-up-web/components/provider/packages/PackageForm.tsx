"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

export type PackageItemRow = {
  serviceItemId: string;
  quantity: number;
};

export type PackageFormValues = {
  name: string;
  desc?: string;
  price: number;
  items: PackageItemRow[];
};

export default function PackageForm({
  initialValues,
  serviceOptions,
  onSubmit,
  submitLabel = "Save",
  loading,
  primaryColor = "#7AA66A",
}: {
  initialValues?: PackageFormValues;
  serviceOptions: { _id: string; label: string }[];
  onSubmit: (v: PackageFormValues) => void;
  submitLabel?: string;
  loading?: boolean;
  primaryColor?: string;
}) {
  const { t } = useTranslation();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [desc, setDesc] = useState(initialValues?.desc ?? "");
  const [price, setPrice] = useState<number>(initialValues?.price ?? 0);

  const [items, setItems] = useState<PackageItemRow[]>(
    initialValues?.items?.length
      ? initialValues.items
      : [{ serviceItemId: "", quantity: 1 }],
  );

  useEffect(() => {
    setName(initialValues?.name ?? "");
    setDesc(initialValues?.desc ?? "");
    setPrice(initialValues?.price ?? 0);
    setItems(
      initialValues?.items?.length
        ? initialValues.items
        : [{ serviceItemId: "", quantity: 1 }],
    );
  }, [initialValues]);

  const addRow = () =>
    setItems((prev) => [...prev, { serviceItemId: "", quantity: 1 }]);

  const removeRow = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (
    index: number,
    field: keyof PackageItemRow,
    value: string | number,
  ) =>
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  const validItems = items.filter((i) => i.serviceItemId && i.quantity > 0);

  const isValid =
    name.trim() !== "" &&
    price > 0 &&
    validItems.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      name: name.trim(),
      desc: desc.trim(),
      price: Number(price),
      items: validItems,
    });
  };

  return (
    <div className="space-y-5">
      {/* Package Name */}
      <div>
        <label className="text-sm font-semibold">
          {t("provider.providerPackages.packageName")}{" "}
          <span className="text-red-500">*</span>
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7AA66A]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-semibold">
          {t("provider.providerPackages.packageDescription")}
        </label>

        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7AA66A]"
        />
      </div>

      {/* Price */}
      <div>
        <label className="text-sm font-semibold">
          {t("provider.providerPackages.packagePrice")}{" "}
          <span className="text-red-500">*</span>
        </label>

        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#7AA66A]"
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">
            {t("provider.providerPackages.packageItems")}{" "}
            <span className="text-red-500">*</span>
          </span>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-sm"
            style={{ color: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            {t("provider.providerPackages.add")}
          </button>
        </div>

        {items.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_80px_40px] gap-2">
            <select
              value={row.serviceItemId}
              onChange={(e) =>
                updateRow(index, "serviceItemId", e.target.value)
              }
              className="h-11 rounded-xl border border-gray-200 px-2 text-sm"
            >
              <option value="">
                {t("provider.providerPackages.selectService")}
              </option>

              {serviceOptions.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) =>
                updateRow(index, "quantity", Number(e.target.value))
              }
              className="h-11 rounded-xl border border-gray-200 px-2 text-sm"
            />

            <button
              type="button"
              onClick={() => removeRow(index)}
              className="h-11 rounded-xl border border-gray-200 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-white font-semibold transition-all ${
          !isValid ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {submitLabel}
      </button>
    </div>
  );
}