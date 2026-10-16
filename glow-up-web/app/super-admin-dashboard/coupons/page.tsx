"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Gift,
  Plus,
  X,
  Loader2,
  Phone,
  Calendar,
  Store,
  User,
  CreditCard,
  SaudiRiyal,
} from "lucide-react";
import {
  couponsService,
  Coupon,
  ProviderOption,
  ProviderServiceOption,
} from "@/integration/services/admin/coupons.service";
import PaginationBar from "@/components/pagination/pagination";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";

const STATUS_THEME: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  ACTIVE: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  PARTIAL_USED: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  USED: {
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  EXPIRED: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const CouponsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewCoupons =
    isAdmin || hasPermission([PermissionType.VIEW_COUPONS]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerServices, setProviderServices] = useState<
    ProviderServiceOption[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [formData, setFormData] = useState({
    providerId: "",
    receivesPhone: "",
    paymentMethod: "CASH",
    selectedServiceIds: [] as string[],
  });

  const fetchCoupons = useCallback(async () => {
    if (!canViewCoupons) return;
    setLoading(true);
    setForbidden(false);
    try {
      const res = await couponsService.list(currentPage, limit);
      setCoupons(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  }, [canViewCoupons, currentPage, limit]);

  const fetchProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const res = await couponsService.getProviders();
      setProviders(res);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  if (!canViewCoupons) {
    return <NoPermission />;
  }

  const handleOpenCreate = () => {
    setShowCreateModal(true);
    fetchProviders();
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setProviderServices([]);
    setLoadingServices(false);
    setCreateError("");
    setFormData({
      providerId: "",
      receivesPhone: "",
      paymentMethod: "CASH",
      selectedServiceIds: [],
    });
  };

  const handleProviderChange = async (providerId: string) => {
    setFormData((prev) => ({
      ...prev,
      providerId,
      selectedServiceIds: [],
    }));

    if (!providerId) {
      setProviderServices([]);
      return;
    }

    setLoadingServices(true);
    try {
      const lang = isRTL ? "ar" : "en";
      const services = await couponsService.getProviderServices(
        providerId,
        lang,
      );
      setProviderServices(services.filter((s) => s.isActive !== false));
    } catch (error) {
      console.error("Error fetching provider services:", error);
      setProviderServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const toggleServiceSelection = (serviceId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedServiceIds.includes(serviceId);
      return {
        ...prev,
        selectedServiceIds: exists
          ? prev.selectedServiceIds.filter((id) => id !== serviceId)
          : [...prev.selectedServiceIds, serviceId],
      };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.providerId ||
      !formData.receivesPhone ||
      formData.selectedServiceIds.length === 0
    ) {
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const services = formData.selectedServiceIds.map((serviceId) => ({
        serviceId,
      }));

      await couponsService.create({
        providerId: formData.providerId,
        receivesPhone: formData.receivesPhone,
        paymentMethod: formData.paymentMethod,
        services,
      });

      handleCloseCreate();
      fetchCoupons();
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      const msg = error?.response?.data?.message || error?.message || (isRTL ? "حدث خطأ" : "An error occurred");
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (
    price: number,
    tone: "default" | "strong" | "success" = "default",
  ) => {
    const colorClass =
      tone === "strong"
        ? "text-gray-900"
        : tone === "success"
          ? "text-emerald-600"
          : "text-gray-600";
    return (
      <span className={`inline-flex items-center gap-1 ${colorClass}`}>
        <span className="tabular-nums">{price}</span>
        <SaudiRiyal className={`h-4 w-4 ${colorClass}`} />
      </span>
    );
  };

  if (forbidden) {
    return <NoPermission />;
  }

  if (loading && coupons.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {t("coupons.title", "Coupons")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("coupons.total", "Total")}: {total}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("coupons.create", "Create Coupon")}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {coupons.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Gift className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {t("coupons.empty", "No coupons found")}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.code", "Code")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.provider", "Provider")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.purchaser", "Purchaser")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.phone", "Phone")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.totalPrice", "Total Price")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.remaining", "Remaining")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.status", "Status")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.expiredAt", "Expires")}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {t("coupons.createdAt", "Created")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => {
                    const statusTheme =
                      STATUS_THEME[coupon.status] || STATUS_THEME.ACTIVE;
                    const remaining =
                      coupon.remaining ??
                      coupon.totalPrice - (coupon.usedPrice ?? 0);

                    return (
                      <tr
                        key={coupon._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700">
                              {coupon.providerId?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700">
                              {coupon.purchaserId?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 font-mono">
                            {coupon.receivesPhone}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900 inline-flex">
                            {formatPrice(coupon.totalPrice, "strong")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-emerald-600 inline-flex">
                            {formatPrice(remaining, "success")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTheme.bg} ${statusTheme.color} border ${statusTheme.border}`}
                          >
                            {t(
                              `coupons.statuses.${coupon.status}`,
                              coupon.status,
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatDate(coupon.expiredAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatDate(coupon.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {coupons.map((coupon) => {
                const statusTheme =
                  STATUS_THEME[coupon.status] || STATUS_THEME.ACTIVE;
                const remaining =
                  coupon.remaining ??
                  coupon.totalPrice - (coupon.usedPrice ?? 0);

                return (
                  <div
                    key={coupon._id}
                    className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("coupons.code", "Code")}
                        </p>
                        <h3 className="font-mono text-sm font-semibold text-gray-900 break-all">
                          {coupon.code}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTheme.bg} ${statusTheme.color} border ${statusTheme.border}`}
                      >
                        {t(`coupons.statuses.${coupon.status}`, coupon.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("coupons.provider", "Provider")}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <Store className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-words">
                            {coupon.providerId?.name || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("coupons.purchaser", "Purchaser")}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="break-words">
                            {coupon.purchaserId?.name || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("coupons.phone", "Phone")}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="font-mono break-all">
                            {coupon.receivesPhone}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                          <p className="text-[11px] font-medium text-gray-400 mb-1">
                            {t("coupons.totalPrice", "Total Price")}
                          </p>
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(coupon.totalPrice, "strong")}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                          <p className="text-[11px] font-medium text-gray-400 mb-1">
                            {t("coupons.remaining", "Remaining")}
                          </p>
                          <div className="text-sm font-medium text-emerald-600">
                            {formatPrice(remaining, "success")}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                          <p className="text-[11px] font-medium text-gray-400 mb-1">
                            {t("coupons.expiredAt", "Expires")}
                          </p>
                          <div className="text-sm text-gray-700">
                            {formatDate(coupon.expiredAt)}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                          <p className="text-[11px] font-medium text-gray-400 mb-1">
                            {t("coupons.createdAt", "Created")}
                          </p>
                          <div className="text-sm text-gray-700">
                            {formatDate(coupon.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-600">
                {t("coupons.page", "Page")} {currentPage}{" "}
                {t("coupons.of", "of")} {totalPages}
              </p>

              <PaginationBar
                page={currentPage}
                totalPages={totalPages}
                limit={limit}
                isRTL={isRTL}
                disabled={loading}
                onPageChange={(p) => setCurrentPage(p)}
                onLimitChange={(n) => {
                  setLimit(n);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between mb-0 p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("coupons.createTitle", "Create New Coupon")}
              </h2>
              <button
                onClick={handleCloseCreate}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-4 p-4 sm:p-6 overflow-y-auto"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Store className="inline h-4 w-4 me-1" />
                  {t("coupons.selectProvider", "Select Provider")}
                </label>
                <select
                  value={formData.providerId}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loadingProviders}
                >
                  <option value="">
                    {loadingProviders
                      ? t("coupons.loadingProviders", "Loading...")
                      : t("coupons.chooseProvider", "Choose a provider")}
                  </option>
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Phone className="inline h-4 w-4 me-1" />
                  {t("coupons.receivesPhone", "Receiver Phone")}
                </label>
                <input
                  type="tel"
                  value={formData.receivesPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({ ...formData, receivesPhone: val });
                  }}
                  maxLength={10}
                  required
                  placeholder="0507882409"
                  className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Calendar className="inline h-4 w-4 me-1" />
                  {t("coupons.serviceIds", "Services")}
                </label>
                <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-2">
                  {!formData.providerId ? (
                    <p className="px-2 py-1 text-xs text-gray-500">
                      {t("coupons.chooseProvider", "Choose a provider")}
                    </p>
                  ) : loadingServices ? (
                    <p className="px-2 py-1 text-xs text-gray-500">
                      {t("coupons.loadingProviders", "Loading...")}
                    </p>
                  ) : providerServices.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-gray-500">
                      {t("coupons.noPackages", "No services available")}
                    </p>
                  ) : (
                    providerServices.map((service) => (
                      <label
                        key={service.serviceId}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={formData.selectedServiceIds.includes(
                            service.serviceId,
                          )}
                          onChange={() =>
                            toggleServiceSelection(service.serviceId)
                          }
                        />
                        <span className="text-xs text-gray-700 break-words">
                          {service.name}
                          {typeof service.price === "number" && (
                            <span className="inline-flex items-center gap-1 text-gray-500">
                              {" - "}
                              <span className="tabular-nums">
                                {service.price}
                              </span>
                              <SaudiRiyal className="h-3.5 w-3.5 text-gray-500" />
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <CreditCard className="inline h-4 w-4 me-1" />
                  {t("coupons.paymentMethod", "Payment Method")}
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="CASH">{isRTL ? "نقدي" : "Cash"}</option>
                </select>
              </div>

              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("coupons.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={
                    creating || formData.selectedServiceIds.length === 0
                  }
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("coupons.submit", "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
