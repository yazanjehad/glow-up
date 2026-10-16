"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  Star,
  Phone,
  Globe,
  Scissors,
  Building2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { ServiceProvider } from "@/integration/services/provider/providerService";
import { SalonUi } from "@/integration/services/provider/provider.types";
import PaginationBar from "@/components/pagination/pagination";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";

const STATUS_THEME = {
  active: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
  inactive: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-100",
    dot: "bg-red-500",
  },
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  SUSPENDED: {
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-100",
    dot: "bg-purple-500",
  },
  undefined: {
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const SuperAdminSalons = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewSalons =
    isAdmin || hasPermission([PermissionType.PROVIDER_VIEW]);
  const canApproveSalons =
    isAdmin || hasPermission([PermissionType.PROVIDER_APPROVE]);
  const canAccessPage = canViewSalons || canApproveSalons;

  const [statusFilter, setStatusFilter] = useState("ALL");
  const filterStatuses = [
    "ALL",
    "PENDING",
    "APPROVED",
    "REJECTED",
    "SUSPENDED",
  ];

  const [salons, setSalons] = useState<SalonUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 150);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const fetchSalons = useCallback(async () => {
    if (!canAccessPage) return;
    setLoading(true);
    try {
      const response = await ServiceProvider.getAllWithStatus({
        page: currentPage,
        limit,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        name: debouncedSearch || undefined,
      });

      const currentTotal = response?.meta?.total || 0;
      setTotalCount(currentTotal);
      setTotalPages(response?.meta?.lastPage || 1);

      if (statusFilter === "ALL" && !debouncedSearch) {
        setGrandTotal(currentTotal);
      }

      const baseList: SalonUi[] = Array.isArray(response?.data)
        ? response.data
        : [];

      setSalons(baseList);
    } catch (error: any) {
      console.error("Error fetching salons:", error);
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
      setSalons([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [canAccessPage, currentPage, statusFilter, debouncedSearch, limit]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    setExpandedRow(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setExpandedRow(null);
  };

  const displaySalons = salons;

  const uniqueCategories = useMemo(
    () => new Set(salons.map((s) => s.category ?? "Unknown")),
    [salons],
  );

  if (!canAccessPage) {
    return <NoPermission />;
  }

  const showListNoPermission = !canViewSalons || forbidden;

  if (loading && salons.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {t("salons.allSalons")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {t("supportCenter.manageProviders")}
            </p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative w-full md:w-auto">
              <Search
                className={`absolute ${isRTL ? "right-3" : "left-3"
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`}
              />
              <input
                type="text"
                placeholder={t("commonD.search")}
                className={`w-full md:w-80 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  } py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all`}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title={t("supportCenter.totalSalons")}
            count={grandTotal || totalCount}
            icon={<Building2 />}
            color="indigo"
          />
          <StatCard
            title={
              statusFilter === "ALL"
                ? isRTL
                  ? "النتائج"
                  : "Results"
                : t(`commonD.${statusFilter.toLowerCase()}`)
            }
            count={totalCount}
            icon={<ShieldCheck />}
            color="emerald"
          />
          <StatCard
            title={t("supportCenter.categoriess")}
            count={uniqueCategories.size}
            icon={<Scissors />}
            color="blue"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
          {filterStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border flex items-center gap-2 ${statusFilter === s
                  ? "bg-slate-900 text-white shadow-lg border-slate-900 scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              <span>{t(`commonD.${s.toLowerCase()}`)}</span>
              {statusFilter === s && (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/100 text-black">
                  {totalCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {showListNoPermission ? (
            <NoPermission type="salons" />
          ) : loading ? (
            <div className="p-10 md:p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin w-8 h-8 text-emerald-600" />
              <p className="text-slate-500 font-medium">
                {t("commonD.loading")}
              </p>
            </div>
          ) : displaySalons.length === 0 ? (
            <div className="p-10 md:p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {isRTL ? "لا توجد نتائج" : "No results found"}
              </h3>
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  setDebouncedSearch("");
                }}
                className="text-emerald-600 text-sm font-bold hover:underline"
              >
                {isRTL ? "عرض الكل" : "View all"}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-start border-separate border-spacing-0 min-w-[880px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("salons.name")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("salons.type")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("salons.city")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("salons.status")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("salons.rating")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                        {t("salons.details")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displaySalons.map((salon) => (
                      <SalonRow
                        key={salon.id}
                        salon={salon}
                        isRTL={isRTL}
                        t={t}
                        isExpanded={expandedRow === salon.id}
                        onToggle={() =>
                          setExpandedRow(
                            expandedRow === salon.id ? null : salon.id,
                          )
                        }
                        onView={() =>
                          router.push(
                            `/super-admin-dashboard/salons/${salon.id}`,
                          )
                        }
                        onRefresh={fetchSalons}
                        canApprove={canApproveSalons}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-4">
                {displaySalons.map((salon) => (
                  <SalonMobileCard
                    key={salon.id}
                    salon={salon}
                    isRTL={isRTL}
                    t={t}
                    isExpanded={expandedRow === salon.id}
                    onToggle={() =>
                      setExpandedRow(expandedRow === salon.id ? null : salon.id)
                    }
                    onView={() =>
                      router.push(`/super-admin-dashboard/salons/${salon.id}`)
                    }
                    onRefresh={fetchSalons}
                    canApprove={canApproveSalons}
                  />
                ))}
              </div>
            </>
          )}

          {displaySalons.length > 0 && (
            <div className="px-4 md:px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <PaginationBar
                page={currentPage}
                totalPages={totalPages}
                limit={limit}
                disabled={loading}
                isRTL={isRTL}
                onPageChange={(p) => setCurrentPage(p)}
                onLimitChange={(n) => setLimit(n)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SalonRow({
  salon,
  isExpanded,
  onToggle,
  isRTL,
  t,
  onView,
  onRefresh,
  canApprove,
}: any) {
  const statusKey = (salon.status?.toLowerCase() ||
    "undefined") as keyof typeof STATUS_THEME;
  const theme = (STATUS_THEME as any)[statusKey] || STATUS_THEME.undefined;
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === salon.status) return;
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      await ServiceProvider.updateStatus({
        id: salon.id,
        status: newStatus as any,
        reason: "Status updated by admin",
      });
      setStatusMessage({
        type: "success",
        text: isRTL ? "تم تحديث الحالة بنجاح" : "Status updated successfully",
      });
      onRefresh();
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          (isRTL ? "فشل في تحديث الحالة" : "Failed to update status"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <tr
        className={`group transition-all ${isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer"
          }`}
        onClick={onToggle}
      >
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 shadow-sm">
              {salon.name?.charAt(0)}
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">
              {salon.name}
            </span>
          </div>
        </td>
        <td className="px-6 py-5 text-xs font-bold text-slate-500 uppercase">
          {salon.category}
        </td>
        <td className="px-6 py-5 text-xs font-medium text-slate-600">
          {salon.location}
        </td>
        <td className="px-6 py-5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${theme.bg} ${theme.color} ${theme.border}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${isUpdating ? "animate-ping" : ""
                }`}
            />
            {statusKey === "active"
              ? t("commonD.approved")
              : t(`commonD.${statusKey}`)}
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-fit">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-amber-700">
              {salon.rating ?? 0}
            </span>
          </div>
        </td>
        <td className="px-6 py-5 text-center">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-all">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-8 bg-white border-y border-slate-100 shadow-inner"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t("salons.description")}
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl italic">
                  {salon.description || "N/A"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailBox
                    icon={<Phone className="w-4 h-4" />}
                    label={t("salons.phones")}
                    value={salon.phone || "---"}
                  />
                  <DetailBox
                    icon={<Globe className="w-4 h-4" />}
                    label="Timezone"
                    value={salon.workingHours?.timezone || "UTC"}
                  />
                </div>
              </div>

              <div className="md:col-span-4 space-y-6">
                <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">
                    {isRTL ? "تحديث الحالة" : "Update Status"}
                  </h4>
                  <select
                    disabled={isUpdating || !canApprove}
                    value={salon.status?.toUpperCase()}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className={`w-full bg-white border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 ${!canApprove ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    <option value="PENDING">{t("commonD.pending")}</option>
                    <option value="APPROVED">{t("commonD.approved")}</option>
                    <option value="REJECTED">{t("commonD.rejected")}</option>
                    <option value="SUSPENDED">{t("commonD.suspended")}</option>
                  </select>
                  {statusMessage && (
                    <div
                      className={`mt-3 p-2 rounded-lg text-xs font-medium ${statusMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                      {statusMessage.text}
                    </div>
                  )}
                </div>

                <button
                  onClick={onView}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 text-white text-xs font-bold rounded-2xl hover:bg-emerald-600 transition-all"
                >
                  <Eye className="w-4 h-4" />{" "}
                  {isRTL ? "عرض الملف" : "View Profile"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SalonMobileCard({
  salon,
  isExpanded,
  onToggle,
  isRTL,
  t,
  onView,
  onRefresh,
  canApprove,
}: any) {
  const statusKey = (salon.status?.toLowerCase() ||
    "undefined") as keyof typeof STATUS_THEME;
  const theme = (STATUS_THEME as any)[statusKey] || STATUS_THEME.undefined;
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === salon.status) return;
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      await ServiceProvider.updateStatus({
        id: salon.id,
        status: newStatus as any,
        reason: "Status updated by admin",
      });
      setStatusMessage({
        type: "success",
        text: isRTL ? "تم تحديث الحالة بنجاح" : "Status updated successfully",
      });
      onRefresh();
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          (isRTL ? "فشل في تحديث الحالة" : "Failed to update status"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 text-start"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 shadow-sm shrink-0">
              {salon.name?.charAt(0)}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {salon.name}
              </h3>
              <p className="text-xs font-medium text-slate-500 truncate mt-1">
                {salon.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${theme.bg} ${theme.color} ${theme.border}`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${isUpdating ? "animate-ping" : ""
                  }`}
              />
              {statusKey === "active"
                ? t("commonD.approved")
                : t(`commonD.${statusKey}`)}
            </div>

            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MobileInfoBox
            label={t("salons.city")}
            value={salon.location || "---"}
          />
          <MobileInfoBox
            label={t("salons.rating")}
            value={
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{salon.rating ?? 0}</span>
              </div>
            }
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/40">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {t("salons.description")}
            </h4>
            <p className="text-sm text-slate-600 bg-white p-4 rounded-2xl italic border border-slate-100">
              {salon.description || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <DetailBox
              icon={<Phone className="w-4 h-4" />}
              label={t("salons.phones")}
              value={salon.phone || "---"}
            />
            <DetailBox
              icon={<Globe className="w-4 h-4" />}
              label="Timezone"
              value={salon.workingHours?.timezone || "UTC"}
            />
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">
              {isRTL ? "تحديث الحالة" : "Update Status"}
            </h4>
            <select
              disabled={isUpdating || !canApprove}
              value={salon.status?.toUpperCase()}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className={`w-full bg-white border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 ${!canApprove ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <option value="PENDING">{t("commonD.pending")}</option>
              <option value="APPROVED">{t("commonD.approved")}</option>
              <option value="REJECTED">{t("commonD.rejected")}</option>
              <option value="SUSPENDED">{t("commonD.suspended")}</option>
            </select>

            {statusMessage && (
              <div
                className={`mt-3 p-2 rounded-lg text-xs font-medium ${statusMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {statusMessage.text}
              </div>
            )}
          </div>

          <button
            onClick={onView}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 text-white text-xs font-bold rounded-2xl hover:bg-emerald-600 transition-all"
          >
            <Eye className="w-4 h-4" /> {isRTL ? "عرض الملف" : "View Profile"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, icon, color }: any) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-black text-slate-900">{count}</p>
      </div>
      <div className={`p-3 rounded-2xl shrink-0 ${(styles as any)[color]}`}>
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-5 h-5",
        })}
      </div>
    </div>
  );
}

function DetailBox({ icon, label, value }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
      </div>
    </div>
  );
}

function MobileInfoBox({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="text-xs font-bold text-slate-700 break-words">
        {value}
      </div>
    </div>
  );
}

export default SuperAdminSalons;
