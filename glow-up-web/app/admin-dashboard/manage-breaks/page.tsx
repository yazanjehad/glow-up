"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Coffee,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  breakRequestService,
  BreakRequest,
  BreakStatus,
} from "@/integration/services/employees/breakRequest.service";
import { hasRole, UserRole } from "@/lib/auth/permissions";
import PaginationBar from "@/components/pagination/pagination";

const statusBadgeClass = (s: BreakStatus) => {
  const v = (s || "").toUpperCase();
  if (v === "APPROVED")
    return "bg-emerald-50 text-emerald-600 border-emerald-100/50";
  if (v === "REJECTED") return "bg-rose-50 text-rose-600 border-rose-100/50";
  return "bg-amber-50 text-amber-600 border-amber-100/50"; // PENDING
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function ManageBreaksPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const themeGreen = "#79A66B";

  const [loading, setLoading] = useState(true);
  const [breaks, setBreaks] = useState<BreakRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BreakStatus | "ALL">("ALL");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isProvider = hasRole([UserRole.PROVIDER]);

  const fetchBreaks = useCallback(async () => {
    try {
      setLoading(true);
      const params: { status?: BreakStatus; page: number; limit: number } = {
        page,
        limit,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await breakRequestService.getAllBreaks(params);
      setBreaks(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error("Failed to fetch breaks:", e);
      setBreaks([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    if (isProvider) {
      fetchBreaks();
    }
  }, [isProvider, fetchBreaks]);

  const filteredBreaks = useMemo(() => {
    if (!search.trim()) return breaks;
    const q = search.toLowerCase();
    return breaks.filter((b) => {
      const name = b.employeeName.toLowerCase();
      return name.includes(q) || b.reason.toLowerCase().includes(q);
    });
  }, [breaks, search]);

  const handleStatusUpdate = async (
    breakId: string,
    newStatus: BreakStatus,
  ) => {
    try {
      setUpdatingId(breakId);
      await breakRequestService.updateBreakStatus(breakId, newStatus);
      fetchBreaks();
    } catch (e: any) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isProvider) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="p-4 sm:p-6">
        <div className="bg-white rounded-[20px] border border-gray-100 p-6 sm:p-8 text-center">
          <Coffee className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {t("breakRequest.noAccess")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("breakRequest.providerOnly")}
          </p>
        </div>
      </div>
    );
  }

  const commonClass =
    "flex items-center h-10 md:h-[38px] border border-gray-200 rounded-lg bg-white transition-all duration-200 focus-within:border-[#79A66B] px-3 shadow-sm hover:shadow-md";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="px-3 py-4 sm:p-6">
      <header className="mb-5 sm:mb-6">
        <div className="flex items-start sm:items-center gap-3 mb-2">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#e2ecdf] shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#79a66b]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] sm:text-[22px] font-semibold text-gray-900 leading-tight">
              {t("breakRequest.manageTitle")}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
              {t("breakRequest.manageSubtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-start gap-3 mb-5 sm:mb-6">
        <div className={`${commonClass} w-full sm:w-[280px] gap-2`}>
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder={t("breakRequest.searchPlaceholder")}
            className="w-full bg-transparent outline-none text-[13px] text-gray-600 placeholder-gray-300"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`${commonClass} w-full sm:min-w-[140px] gap-2`}
          >
            <Filter
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: themeGreen }}
            />
            <span className="text-[12px] text-gray-500 font-medium flex-grow text-start truncate">
              {statusFilter === "ALL"
                ? t("all")
                : t(`breakRequest.status.${statusFilter.toLowerCase()}`)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-300 transition-transform shrink-0 ${
                showStatusMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusMenu && (
            <div className="absolute z-40 mt-2 end-0 w-full sm:w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in duration-200">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt);
                      setShowStatusMenu(false);
                      setPage(1);
                    }}
                    className="w-full text-start px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-between"
                    style={{
                      color: statusFilter === opt ? themeGreen : "#6b7280",
                    }}
                  >
                    <span className={statusFilter === opt ? "font-bold" : ""}>
                      {opt === "ALL"
                        ? t("all")
                        : t(`breakRequest.status.${opt.toLowerCase()}`)}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-2 sm:p-3 text-start font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("breakRequest.employee")}
                </th>
                <th className="p-2 sm:p-3 text-start font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("breakRequest.fields.date")}
                </th>
                <th className="p-2 sm:p-3 text-start font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("breakRequest.fields.startTime")}
                </th>
                <th className="p-2 sm:p-3 text-start font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("breakRequest.fields.endTime")}
                </th>
                <th className="p-2 sm:p-3 text-start font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("breakRequest.fields.reason")}
                </th>
                <th className="p-2 sm:p-3 text-center font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("commonD.status")}
                </th>
                <th className="p-2 sm:p-3 text-center font-semibold text-gray-500 text-[10px] sm:text-xs uppercase whitespace-nowrap">
                  {t("commonD.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading &&
                filteredBreaks.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-2 sm:p-3 text-gray-700 font-medium text-start text-[12px] sm:text-sm whitespace-nowrap">
                      {b.employeeName}
                    </td>
                    <td className="p-2 sm:p-3 text-gray-600 text-start text-[12px] sm:text-sm whitespace-nowrap">
                      {formatDate(b.date)}
                    </td>
                    <td className="p-2 sm:p-3 text-gray-600 text-start text-[12px] sm:text-sm whitespace-nowrap">
                      {b.startTime}
                    </td>
                    <td className="p-2 sm:p-3 text-gray-600 text-start text-[12px] sm:text-sm whitespace-nowrap">
                      {b.endTime}
                    </td>
                    <td
                      className="p-2 sm:p-3 text-gray-600 text-start max-w-[160px] sm:max-w-[180px] truncate text-[12px] sm:text-sm"
                      title={b.reason}
                    >
                      {b.reason}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${statusBadgeClass(
                          b.status,
                        )}`}
                      >
                        {t(`breakRequest.status.${b.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">
                      {b.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updatingId === b.id}
                            onClick={() => handleStatusUpdate(b.id, "APPROVED")}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2 text-[11px] sm:text-xs"
                          >
                            {updatingId === b.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 me-1" />
                                {t("breakRequest.approve")}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updatingId === b.id}
                            onClick={() => handleStatusUpdate(b.id, "REJECTED")}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-[11px] sm:text-xs"
                          >
                            {updatingId === b.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 me-1" />
                                {t("breakRequest.reject")}
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-10 sm:p-12 text-center">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-200 border-t-[#79A66B] rounded-full"></div>
          </div>
        )}

        {!loading && filteredBreaks.length === 0 && (
          <div className="p-10 sm:p-12 text-center text-gray-400 text-sm">
            {t("breakRequest.noRequests")}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-5 sm:mt-6 overflow-x-auto">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            limit={limit}
            disabled={loading}
            isRTL={isRTL}
            rowsOptions={[10, 20, 50]}
            onPageChange={setPage}
            onLimitChange={setLimit}
            scrollToTop={true}
          />
        </div>
      )}
    </div>
  );
}
