"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  Scissors,
  Tag,
  Eye,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ServiceProvider } from "@/integration/services/provider/providerService";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const AdminServicesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canAccessPage =
    isAdmin || hasPermission([PermissionType.PROVIDER_VIEW]);

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rejectItem, setRejectItem] = useState<{ providerId: string; serviceId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPendingServices = useCallback(async (targetPage = 1) => {
    if (!canAccessPage) return;
    setLoading(true);
    try {
      const response = await ServiceProvider.getPendingServices(targetPage, PAGE_SIZE);
      // API returns: { data: [...], total, page, limit, totalPages }
      const data = response?.data ?? response ?? [];
      setServices(Array.isArray(data) ? data : []);
      setTotal(response?.total ?? (Array.isArray(data) ? data.length : 0));
      setTotalPages(response?.totalPages ?? 1);
      setPage(targetPage);
    } catch (error) {
      console.error("Error fetching pending services:", error);
    } finally {
      setLoading(false);
    }
  }, [canAccessPage]);

  useEffect(() => {
    fetchPendingServices(1);
  }, [fetchPendingServices]);

  const handleAction = async (
    providerId: string,
    serviceId: string,
    status: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    setActionLoading(serviceId);
    try {
      await ServiceProvider.updateServiceStatus(
        providerId,
        serviceId,
        status,
        reason
      );

      // Remove locally and refresh if page is now empty
      setServices((prev) => {
        const updated = prev.filter((s) => {
          const sId =
            s.serviceItem?.id ||
            s.serviceItem?._id ||
            s.service?.id ||
            s.service?._id ||
            s.id ||
            s._id;
          return sId !== serviceId;
        });
        // If current page is now empty and not on first page, go back one page
        if (updated.length === 0 && page > 1) {
          fetchPendingServices(page - 1);
        } else if (updated.length === 0) {
          fetchPendingServices(1);
        }
        return updated;
      });

      setTotal((prev) => Math.max(0, prev - 1));

      if (status === "REJECTED") {
        setRejectItem(null);
        setRejectReason("");
      }
    } catch (error) {
      console.error("Service action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredServices = services.filter((s) => {
    const service = s.serviceItem || s.service || s;
    const name =
      service.name?.ar || service.name?.en || service.name || "";
    const providerName = s.providerName || s.provider?.name || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      providerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (!canAccessPage) return <NoPermission />;

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              {t("adminServices.title")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {t("adminServices.subtitle")}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400",
                isRTL ? "right-3" : "left-3"
              )}
            />
            <input
              type="text"
              placeholder={t("adminServices.searchPlaceholder")}
              className={cn(
                "w-full py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm",
                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title={t("adminServices.stats.totalPending")}
            count={total}
            icon={<Scissors />}
            color="amber"
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin w-8 h-8 text-emerald-600" />
              <p className="text-slate-500 font-medium">
                {t("commonD.loading")}
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Scissors className="w-10 h-10 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-800">
                {t("adminServices.empty.title")}
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                {t("adminServices.empty.desc")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400">
                      {t("adminServices.table.service")}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400">
                      {t("adminServices.table.salon")}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400">
                      {t("adminServices.table.price")}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400">
                      {t("adminServices.table.duration")}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 text-center">
                      {t("adminServices.table.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServices.map((item) => {
                    const service = item.serviceItem || item.service || item;
                    const sId = service.id || service._id;
                    const pId =
                      item.providerId || item.provider?._id || item.provider?.id;

                    const pName =
                      item.providerName || item.provider?.name || "";

                    const sName =
                      service.name?.ar ||
                      service.name?.en ||
                      service.name ||
                      "";

                    const isExp = expandedRow === sId;

                    return (
                      <React.Fragment key={sId}>
                        <tr
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() =>
                            setExpandedRow(isExp ? null : sId)
                          }
                        >
                          <td className="px-6 py-5 font-bold">
                            {sName}
                          </td>

                          <td className="px-6 py-5">
                            <div className="text-sm text-slate-600">
                              {pName}
                            </div>
                          </td>

                          <td className="px-6 py-5 font-bold text-emerald-600">
                            {service.price}
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            {service.durationMinutes}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <div
                              className="flex items-center justify-center gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleAction(pId, sId, "APPROVED")}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2"
                              >
                                {actionLoading === sId ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                {isRTL ? "قبول" : "Approve"}
                              </button>

                              <button
                                onClick={() => setRejectItem({ providerId: pId, serviceId: sId })}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-all flex items-center gap-2"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {isRTL ? "رفض" : "Reject"}
                              </button>

                              <button
                                onClick={() => setExpandedRow(isExp ? null : sId)}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  isExp ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                )}
                              >
                                {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExp && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={5} className="px-6 py-8 border-y border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                                {/* Service Info */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Scissors className="w-3 h-3" />
                                    {isRTL ? "تفاصيل الخدمة" : "Service Details"}
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                        <Tag className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">
                                          {isRTL ? "التصنيف" : "Category"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                          {item.category?.name || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">
                                          {isRTL ? "النوع" : "Type"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                          {service.type?.name || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Provider Info */}
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="w-3 h-3" />
                                    {isRTL ? "معلومات المزود" : "Provider Info"}
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                        <Mail className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">
                                          {isRTL ? "البريد الإلكتروني" : "Email"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-700 truncate">
                                          {item.provider?.email || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                        <Phone className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase leading-tight">
                                          {isRTL ? "رقم الهاتف" : "Phone"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                          {item.provider?.phone || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {isRTL
                      ? `الصفحة ${page} من ${totalPages} — إجمالي ${total} خدمة`
                      : `Page ${page} of ${totalPages} — ${total} total`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchPendingServices(page - 1)}
                      disabled={page <= 1 || loading}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => fetchPendingServices(p as number)}
                            disabled={loading}
                            className={cn(
                              "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                              page === p
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => fetchPendingServices(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {isRTL ? "رفض الخدمة" : "Reject Service"}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {isRTL
                  ? "يرجى كتابة سبب الرفض لتوضيحه للمزود."
                  : "Please provide a reason for rejecting this service."}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isRTL ? "سبب الرفض" : "Rejection Reason"}
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isRTL ? "اكتب السبب هنا..." : "Type the reason here..."}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setRejectItem(null);
                  setRejectReason("");
                }}
                disabled={!!actionLoading}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleAction(rejectItem.providerId, rejectItem.serviceId, "REJECTED", rejectReason)}
                disabled={!rejectReason.trim() || !!actionLoading}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {actionLoading === rejectItem.serviceId && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isRTL ? "تأكيد الرفض" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ title, count, icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border shadow-sm flex justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400">{title}</p>
        <p className="text-2xl font-black">{count}</p>
      </div>
      <div>{icon}</div>
    </div>
  );
}

export default AdminServicesPage;