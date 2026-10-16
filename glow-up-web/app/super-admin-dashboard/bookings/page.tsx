"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  User,
  Briefcase,
  Calendar,
  CheckCircle2,
  Building2,
  Scissors,
  Receipt,
  Trash2,
  RefreshCw,
  SaudiRiyal,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { AppointmentUi } from "@/integration/services/appointments/appointments.type";
import { AppointmentsService } from "@/integration/services/appointments/appointments.service";
import PaginationBar from "@/components/pagination/pagination";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";

const STATUS_MAP = {
  PENDING: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
  },
  COMPLETED: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  CANCELLED: {
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-300",
  },
};

export default function SuperAdminAppointments() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewBookings =
    isAdmin || hasPermission([PermissionType.APPOINTMENT_VIEW]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"PROVIDER" | "CUSTOMER">(
    "PROVIDER",
  );

  const [appointments, setAppointments] = useState<AppointmentUi[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);

  const [apiStats, setApiStats] = useState({
    approved: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });

  const apiFilters = useMemo(() => {
    const v = searchTerm.trim();

    const filters: {
      status?: string;
      customerName?: string;
      providerName?: string;
    } = {};

    if (statusFilter !== "ALL") filters.status = statusFilter;

    if (v) {
      if (searchMode === "CUSTOMER") filters.customerName = v;
      if (searchMode === "PROVIDER") filters.providerName = v;
    }

    return filters;
  }, [statusFilter, searchTerm, searchMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageLimit, searchTerm, searchMode]);

  useEffect(() => {
    if (!canViewBookings) return;
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await AppointmentsService.getAllAdminAppointments(
          currentPage,
          pageLimit,
          apiFilters,
        );

        let actualTotal = res.total || 0;
        let actualTotalPages = res.totalPages || 1;

        if (res.stats) {
          // Identify expected total from stats based on filter
          let expectedTotal = 0;
          if (statusFilter === "CONFIRMED") expectedTotal = res.stats.approved || 0;
          else if (statusFilter === "COMPLETED") expectedTotal = res.stats.completed || 0;
          else if (statusFilter === "CANCELLED") expectedTotal = res.stats.cancelled || 0;
          else {
            expectedTotal =
              (res.stats.approved || 0) +
              (res.stats.completed || 0) +
              (res.stats.cancelled || 0);
          }

          // If expectedTotal is greater than what backend returns for total, trust the stats
          if (expectedTotal > actualTotal) {
            actualTotal = expectedTotal;
            actualTotalPages = Math.ceil(actualTotal / pageLimit);
          }
        }

        setAppointments(res.data);
        setTotalPages(actualTotalPages);
        setTotalRecords(actualTotal);

        if (statusFilter === "ALL" && !searchTerm.trim()) {
          setGrandTotal(actualTotal);
          if (res.stats) {
            setApiStats({
              approved: res.stats.approved || 0,
              completed: res.stats.completed || 0,
              cancelled: res.stats.cancelled || 0,
              total: actualTotal,
            });
          }
        }
      } catch (err: any) {
        console.error(err);
        if (err?.response?.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [
    canViewBookings,
    currentPage,
    pageLimit,
    apiFilters,
    statusFilter,
    searchTerm,
  ]);

  if (!canViewBookings || forbidden) {
    return <NoPermission />;
  }

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {t("appointments.title")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {t("appointments.description")}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 w-full">
              <Search
                className={`absolute ${isRTL ? "right-3" : "left-3"
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`}
              />
              <input
                type="text"
                placeholder={t("appointments.search")}
                className={`w-full md:w-80 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  } py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={searchMode}
              onChange={(e) =>
                setSearchMode(e.target.value as "PROVIDER" | "CUSTOMER")
              }
              className="w-full md:w-auto py-2.5 px-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none shadow-sm"
            >
              <option value="PROVIDER">
                {t("appointments.searchProvider", "Provider")}
              </option>
              <option value="CUSTOMER">
                {t("appointments.searchCustomer", "Customer")}
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title={t("appointments.total")}
            count={grandTotal || totalRecords}
            icon={<Calendar />}
            color="indigo"
          />
          <StatCard
            title={t("appointments.approved")}
            count={apiStats.approved}
            icon={<CheckCircle2 />}
            color="emerald"
          />
          <StatCard
            title={t("appointments.completed")}
            count={apiStats.completed}
            icon={<CheckCircle2 />}
            color="blue"
          />
          <StatCard
            title={t("appointments.cancelled")}
            count={apiStats.cancelled}
            icon={<Trash2 />}
            color="red"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar p-1">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 md:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border flex items-center gap-2 ${statusFilter === s
                  ? "bg-slate-900 text-white shadow-lg border-slate-900 scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
              >
                <span>{t(`appointments.status.${s}`)}</span>
                {statusFilter === s && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/95 text-black">
                    {totalRecords}
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 md:p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin w-8 h-8 text-emerald-600" />
              <p className="text-slate-500 font-medium">
                {t("commonD.loading")}
              </p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-10 md:p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {t("appointments.noAppointments")}
              </h3>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px] text-start border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("appointments.provider")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("appointments.customer")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("appointments.date")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("appointments.totalPrice")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-start">
                        {t("appointments.statusLabel")}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                        {t("appointments.details")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt) => (
                      <AppointmentRow
                        key={appt.id}
                        appt={appt}
                        isRTL={isRTL}
                        isExpanded={expandedId === appt.id}
                        onToggle={() =>
                          setExpandedId(expandedId === appt.id ? null : appt.id)
                        }
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-4">
                {appointments.map((appt) => (
                  <AppointmentMobileCard
                    key={appt.id}
                    appt={appt}
                    isRTL={isRTL}
                    isExpanded={expandedId === appt.id}
                    onToggle={() =>
                      setExpandedId(expandedId === appt.id ? null : appt.id)
                    }
                    t={t}
                  />
                ))}
              </div>
            </>
          )}

          {appointments.length > 0 && (
            <div className="px-4 md:px-6 py-4 bg-slate-50/50 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("commonD.showing")}{" "}
                  <span className="text-slate-900">
                    {(currentPage - 1) * pageLimit + 1}
                  </span>{" "}
                  -{" "}
                  <span className="text-slate-900">
                    {Math.min(currentPage * pageLimit, totalRecords)}
                  </span>{" "}
                  {t("commonD.of")}{" "}
                  <span className="text-slate-900">{totalRecords}</span>
                </p>

                <PaginationBar
                  page={currentPage}
                  totalPages={totalPages}
                  limit={pageLimit}
                  disabled={loading}
                  isRTL={isRTL}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onLimitChange={(n) => {
                    setPageLimit(n);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ appt, isExpanded, onToggle, isRTL, t }: any) {
  const s =
    STATUS_MAP[appt.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING;

  const formattedDate = new Date(appt.date).toLocaleDateString(
    isRTL ? "ar" : "en",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <>
      <tr
        className={`group transition-all ${isExpanded ? "bg-emerald-50/20" : "hover:bg-slate-50 cursor-pointer"
          }`}
        onClick={onToggle}
      >
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors border border-slate-200 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              {appt.providerName}
            </span>
          </div>
        </td>

        <td className="px-6 py-5 text-sm text-slate-600 font-medium">
          {appt.customerName}
        </td>

        <td className="px-6 py-5">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">
              {formattedDate}
            </span>
            <span className="text-[10px] text-slate-400 font-black uppercase">
              {appt.timeStart} - {appt.timeEnd}
            </span>
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="flex flex-col">
            <span className="flex items-center gap-1">
              {appt.totalPrice}
              <SaudiRiyal className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {appt.totalDurationMinutes} {t("appointments.min")}
            </span>
          </div>
        </td>

        <td className="px-6 py-5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {t(`appointments.status.${appt.status}`)}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <DetailBox
                  icon={<Briefcase />}
                  label={t("appointments.employee")}
                  value={appt.employeeName}
                />
                <DetailBox
                  icon={<Clock />}
                  label={t("appointments.bookingType")}
                  value={appt.bookingType}
                />
                <DetailBox
                  icon={<User />}
                  label={t("appointments.note")}
                  value={appt.customerNote || t("appointments.noNote")}
                />
              </div>

              <div className="lg:col-span-2 bg-slate-50/50 rounded-3xl border border-slate-100 p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-4">
                  <Scissors className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {t("appointments.services")}
                  </span>
                </div>

                <div className="space-y-2">
                  {appt.services?.map((service: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-700 break-words">
                          {service.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold break-words">
                          {service.employee}
                        </span>
                      </div>
                      <span className="text-sm font-black text-emerald-600 shrink-0">
                        {service.price} {t("currency", "SAR")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-dashed border-slate-200 flex justify-between items-center gap-3 flex-wrap">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {t("appointments.totalAmount")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {appt.totalPrice}
                      <SaudiRiyal className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AppointmentMobileCard({ appt, isExpanded, onToggle, isRTL, t }: any) {
  const s =
    STATUS_MAP[appt.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING;

  const formattedDate = new Date(appt.date).toLocaleDateString(
    isRTL ? "ar" : "en",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 text-start"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 break-words">
                {appt.providerName}
              </h3>
              <p className="text-xs text-slate-500 mt-1 break-words">
                {appt.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.color} ${s.border}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {t(`appointments.status.${appt.status}`)}
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
            label={t("appointments.date")}
            value={
              <div className="space-y-1">
                <div>{formattedDate}</div>
                <div className="text-[11px] text-slate-500">
                  {appt.timeStart} - {appt.timeEnd}
                </div>
              </div>
            }
          />
          <MobileInfoBox
            label={t("appointments.totalPrice")}
            value={
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {appt.totalPrice}
                  <SaudiRiyal className="w-4 h-4" />
                </div>

                <div className="text-[11px] text-slate-500">
                  {appt.totalDurationMinutes} {t("appointments.min")}
                </div>
              </div>
            }
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/40">
          <div className="grid grid-cols-1 gap-3">
            <DetailBox
              icon={<Briefcase />}
              label={t("appointments.employee")}
              value={appt.employeeName}
            />
            <DetailBox
              icon={<Clock />}
              label={t("appointments.bookingType")}
              value={appt.bookingType}
            />
            <DetailBox
              icon={<User />}
              label={t("appointments.note")}
              value={appt.customerNote || t("appointments.noNote")}
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-4">
              <Scissors className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {t("appointments.services")}
              </span>
            </div>

            <div className="space-y-2">
              {appt.services?.map((service: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-700 break-words">
                      {service.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold break-words">
                      {service.employee}
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 shrink-0 inline-flex items-center gap-1">
                    {service.price}
                    <SaudiRiyal className="w-4 h-4" />
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-dashed border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {t("appointments.totalAmount")}
              </span>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-black text-emerald-700">
                  {appt.totalPrice} {t("currency", "SAR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, icon, color }: any) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">
          {count}
        </p>
      </div>
      <div
        className={`p-3 rounded-2xl shrink-0 ${colors[color as keyof typeof colors]
          }`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-5 h-5",
        })}
      </div>
    </div>
  );
}

function DetailBox({ icon, label, value }: any) {
  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
      <div className="p-3 bg-slate-50 rounded-xl text-slate-400 shrink-0">
        {React.cloneElement(icon as React.ReactElement, {
          className: "w-4 h-4",
        })}
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
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="text-xs font-bold text-slate-700 break-words">
        {value}
      </div>
    </div>
  );
}
