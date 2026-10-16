"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, X, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  lookupsService,
  Lookup,
  CreateLookupPayload,
  UpdateLookupPayload,
} from "@/integration/services/admin/lookups.service";
import PaginationBar from "@/components/pagination/pagination";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";

const LOOKUP_KEYS = [
  "PROVIDER_TYPE",
  "EMPLOYEE_POSITION",
  "SERVICE_CATEGORY",
  "SERVICE_TYPE",
];

export default function LookupsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = i18n.language as "en" | "ar";

  const isAdmin = isSuperAdmin();
  const canViewLookups =
    isAdmin || hasPermission([PermissionType.VIEW_LOOKUPS]);
  const canAddLookups = isAdmin || hasPermission([PermissionType.ADD_LOOKUPS]);
  const canAccessPage = canViewLookups || canAddLookups;

  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  const [showModal, setShowModal] = useState(false);
  const [editingLookup, setEditingLookup] = useState<Lookup | null>(null);

  const [filterKey, setFilterKey] = useState("");

  const loadLookups = useCallback(async () => {
    if (!canAccessPage) return;
    try {
      setLoading(true);
      setError("");
      setForbidden(false);
      const response = await lookupsService.list(page, limit);
      setLookups(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (e: any) {
      console.error("Failed to load lookups", e);
      const status = e?.response?.status;
      if (status === 403) {
        setForbidden(true);
      } else {
        setError(e?.message || t("lookups.errors.loadFailed"));
      }
      setLookups([]);
    } finally {
      setLoading(false);
    }
  }, [canAccessPage, page, limit, t]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  if (!canAccessPage) {
    return <NoPermission />;
  }

  const openAddModal = () => {
    setEditingLookup(null);
    setShowModal(true);
  };

  const openEditModal = (lookup: Lookup) => {
    setEditingLookup(lookup);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingLookup(null);
    loadLookups();
  };

  const filteredLookups = filterKey
    ? lookups.filter((l) => l.key === filterKey)
    : lookups;

  const showListNoPermission = !canViewLookups || forbidden;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
            {t("lookups.title")}
          </h2>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
            {t("lookups.subtitle")}
          </p>
        </div>
        {canAddLookups && (
          <Button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#79a66b] hover:bg-[#6a9460] text-white w-full sm:w-auto"
          >
            <Plus size={18} />
            {t("lookups.addLookup")}
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-4 flex gap-2 flex-wrap">
        <Button
          variant={filterKey === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterKey("")}
        >
          {t("lookups.filters.all")}
        </Button>
        {LOOKUP_KEYS.map((key) => (
          <Button
            key={key}
            variant={filterKey === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterKey(key)}
            className="max-w-full"
          >
            <span className="truncate">{t(`lookups.keys.${key}`)}</span>
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
        {showListNoPermission ? (
          <NoPermission type="lookups" />
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : filteredLookups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("lookups.noLookups")}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.key")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.code")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.name")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.status")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.order")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("lookups.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLookups.map((lookup) => (
                    <tr key={lookup._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t(`lookups.keys.${lookup.key}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {lookup.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {typeof lookup.name === "string"
                          ? lookup.name
                          : lookup.name?.[lang] || lookup.name?.en || ""}
                      </td>
                      <td className="px-6 py-4">
                        {lookup.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check size={12} />
                            {t("lookups.status.active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle size={12} />
                            {t("lookups.status.inactive")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lookup.order}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(lookup)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          {t("lookups.edit")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {filteredLookups.map((lookup) => (
                <div
                  key={lookup._id}
                  className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {t(`lookups.keys.${lookup.key}`)}
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-gray-900 break-words">
                        {typeof lookup.name === "string"
                          ? lookup.name
                          : lookup.name?.[lang] || lookup.name?.en || ""}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 font-mono break-all">
                        {lookup.code}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(lookup)}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <Edit2 size={14} />
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-medium text-gray-400 mb-1">
                        {t("lookups.table.status")}
                      </p>
                      {lookup.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check size={12} />
                          {t("lookups.status.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle size={12} />
                          {t("lookups.status.inactive")}
                        </span>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-medium text-gray-400 mb-1">
                        {t("lookups.table.order")}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {lookup.order}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gray-500">
                    {t("lookups.pagination.showing", {
                      from: (page - 1) * limit + 1,
                      to: Math.min(page * limit, total),
                      total,
                    })}
                  </p>

                  <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    limit={limit}
                    isRTL={isRTL}
                    disabled={loading}
                    onPageChange={(p) => setPage(p)}
                    onLimitChange={(n) => {
                      setLimit(n);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <LookupModal
          lookup={editingLookup}
          onClose={() => {
            setShowModal(false);
            setEditingLookup(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

function LookupModal({
  lookup,
  onClose,
  onSuccess,
}: {
  lookup: Lookup | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isEditing = !!lookup;

  const [form, setForm] = useState<CreateLookupPayload>(() => {
    let en = "";
    let ar = "";

    if (lookup?.name) {
      if (typeof lookup.name === "string") {
        ar = lookup.name;
      } else {
        en = lookup.name.en || "";
        ar = lookup.name.ar || "";
      }
    }

    return {
      key: lookup?.key || "SERVICE_CATEGORY",
      code: lookup?.code || "",
      name: { en, ar },
      isActive: lookup?.isActive ?? true,
      order: lookup?.order || 1,
    };
  });

  useEffect(() => {
    if (lookup) {
      const nameObj = typeof lookup.name === "string"
        ? { en: "", ar: lookup.name }
        : { en: lookup.name?.en || "", ar: lookup.name?.ar || "" };

      setForm({
        key: lookup.key,
        code: lookup.code,
        name: nameObj,
        isActive: lookup.isActive,
        order: lookup.order,
      });
    }
  }, [lookup]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      setError(t("lookups.validation.codeRequired"));
      return;
    }
    if (!form.name.en.trim()) {
      setError(t("lookups.validation.nameEnRequired"));
      return;
    }
    if (!form.name.ar.trim()) {
      setError(t("lookups.validation.nameArRequired"));
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isEditing && lookup) {
        const payload: UpdateLookupPayload = {
          key: form.key,
          code: form.code.trim().toUpperCase(),
          name: {
            en: form.name.en.trim(),
            ar: form.name.ar.trim(),
          },
          isActive: form.isActive,
          order: form.order,
        };
        await lookupsService.update(lookup._id, payload);
      } else {
        const payload: CreateLookupPayload = {
          key: form.key,
          code: form.code.trim().toUpperCase(),
          name: {
            en: form.name.en.trim(),
            ar: form.name.ar.trim(),
          },
          isActive: form.isActive,
          order: form.order,
        };
        await lookupsService.create(payload);
      }
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("lookups.errors.saveFailed");
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-[20px] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {isEditing
              ? t("lookups.modal.editTitle")
              : t("lookups.modal.addTitle")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 break-words">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("lookups.fields.key")} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#79a66b] focus:border-transparent"
            >
              {LOOKUP_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`lookups.keys.${key}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("lookups.fields.code")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder={t("lookups.placeholders.code")}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("lookups.fields.nameAr")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name.ar}
              onChange={(e) =>
                setForm({ ...form, name: { ...form.name, ar: e.target.value } })
              }
              placeholder={t("lookups.placeholders.nameAr")}
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("lookups.fields.nameEn")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name.en}
              onChange={(e) =>
                setForm({ ...form, name: { ...form.name, en: e.target.value } })
              }
              placeholder={t("lookups.placeholders.nameEn")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("lookups.fields.order")}
            </label>
            <Input
              type="number"
              min={1}
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: parseInt(e.target.value) || 1 })
              }
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 text-[#79a66b] border-gray-300 rounded focus:ring-[#79a66b]"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              {t("lookups.fields.isActive")}
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#79a66b] hover:bg-[#6a9460] text-white"
            >
              {saving ? t("loading") : t("lookups.modal.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
