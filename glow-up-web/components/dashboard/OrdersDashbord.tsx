"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Calendar, Filter, X, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaudiRiyal } from "lucide-react";

import {
  ProviderAppointmentsService,
  type ProviderAppointmentDto,
  type AppointmentStatus,
} from "@/integration/services/provider/providerAppointments.service";
import { AppointmentsService } from "@/integration/services/appointments/appointments.service";
import { ProviderSlotsService } from "@/integration/services/provider/providerService";
import type { ProviderSlotItemDto } from "@/app/models/provider-slots";

import { Button } from "../ui/button";
import PaginationBar from "@/components/pagination/pagination";
import AppointmentDetailsDialog from "./AppointmentDetailsDialog";
import { getCurrentUser, UserRole } from "@/lib/auth/permissions";
const formatDateTime = (iso?: string, timeSlot?: { start: string; end: string }, locale: string = "ar") => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}/${mm}/${dd}`;

  return dateStr;
};

const statusLabel = (s: AppointmentStatus, t: any) => {
  const v = (s || "").toUpperCase();
  if (v === "CONFIRMED") return t("confirmed");
  if (v === "COMPLETED") return t("completed");
  if (v === "CANCELLED") return t("cancelled");
  if (v === "PENDING") return t("pending");
  if (v === "NO_SHOW") return t("noShow");
  return s;
};

const statusBadgeClass = (s: AppointmentStatus) => {
  const v = (s || "").toUpperCase();
  if (v === "CONFIRMED") {
    return "bg-emerald-50 text-emerald-600 border-emerald-100/50";
  }
  if (v === "COMPLETED") return "bg-blue-50 text-blue-600 border-blue-100/50";
  if (v === "CANCELLED") return "bg-rose-50 text-rose-600 border-rose-100/50";
  if (v === "PENDING") return "bg-amber-50 text-amber-600 border-amber-100/50";
  if (v === "NO_SHOW") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-gray-50 text-gray-500 border-gray-100";
};

const OrdersDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const themeGreen = "#79A66B";

  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");
  const [tempDateFrom, setTempDateFrom] = useState<string>("");
  const [tempDateTo, setTempDateTo] = useState<string>("");
  const [appointments, setAppointments] = useState<ProviderAppointmentDto[]>(
    [],
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<ProviderAppointmentDto | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>("");
  const [cancelPopupParams, setCancelPopupParams] = useState<{ row: ProviderAppointmentDto | null, open: boolean }>({ row: null, open: false });
  const [changeTimePopupParams, setChangeTimePopupParams] = useState<{ row: ProviderAppointmentDto | null, open: boolean }>({ row: null, open: false });
  const [newTimeSlot, setNewTimeSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<ProviderSlotItemDto[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        let data: ProviderAppointmentDto[] = [];
        const user = getCurrentUser();
        if (user?.role === UserRole.PROVIDER) {
          data = await ProviderAppointmentsService.getMyAppointments();
        } else {
          data = await ProviderAppointmentsService.getEmployeeAppointments();
        }
        if (!alive) return;
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error("Failed to fetch appointments:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return appointments.filter((a) => {
      const matchQ =
        !query ||
        (a.customerName || "").toLowerCase().includes(query) ||
        (a.appointmentId || "").toLowerCase().includes(query);

      const matchStatus =
        statusFilter === "ALL" ||
        (a.status || "").toUpperCase() === statusFilter;

      const iso = (a as any)?.date || (a as any)?.services?.[0]?.date || "";
      const d = iso ? new Date(iso) : null;

      const fromOk = !appliedDateFrom || (d && d >= new Date(appliedDateFrom));
      const toOk =
        !appliedDateTo ||
        (d && d <= new Date(`${appliedDateTo}T23:59:59.999Z`));

      return matchQ && matchStatus && fromOk && toOk;
    });
  }, [appointments, q, statusFilter, appliedDateFrom, appliedDateTo]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), lastPage));
  }, [lastPage]);

  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleApplyDate = () => {
    setAppliedDateFrom(tempDateFrom);
    setAppliedDateTo(tempDateTo);
    setShowDate(false);
    setPage(1);
  };

  const handleClearDate = () => {
    setTempDateFrom("");
    setTempDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setShowDate(false);
    setPage(1);
  };

  const commonClass =
    "flex items-center h-10 md:h-[38px] border border-gray-200 rounded-lg bg-white transition-all duration-200 focus-within:border-[#79A66B] px-3 shadow-sm hover:shadow-md";

  async function handleCancel(appointmentId: string): Promise<void> {
    try {
      setUpdatingId(appointmentId);
      await AppointmentsService.cancelAppointment(appointmentId, "No Reason");

      setAppointments((prev) =>
        prev.map((item) =>
          item.appointmentId === appointmentId
            ? { ...item, status: "CANCELLED" as AppointmentStatus }
            : item,
        ),
      );
    } catch (error) {
      console.error("Cancel appointment failed:", error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleChangeTimeSlot(row: ProviderAppointmentDto): Promise<void> {
    setChangeTimePopupParams({ row, open: true });
    setNewTimeSlot("");
    setAvailableSlots([]);
    setActionError("");
    // Set initial date from appointment
    const appointmentDate = row.date || row.services?.[0]?.date || "";
    const initialDate = appointmentDate ? appointmentDate.split("T")[0] : new Date().toISOString().split("T")[0];
    setSelectedDate(initialDate);
    // Fetch slots for the initial date
    await fetchSlotsForDate(row, initialDate);
  }

  async function fetchSlotsForDate(row: ProviderAppointmentDto, date: string): Promise<void> {
    if (!date || !row.services?.length) return;

    const providerId = localStorage.getItem("providerId") || "";
    const serviceId = row.services[0]?.serviceItemId || "";
    const employeeId = row.services[0]?.employeeId?._id || "";

    if (!providerId || !serviceId) return;

    try {
      setLoadingSlots(true);
      const data = await ProviderSlotsService.getByProviderId(providerId, date, serviceId, employeeId);
      setAvailableSlots(data?.slots || []);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleConfirmChangeTimeSlot(): Promise<void> {
    if (!changeTimePopupParams.row || !newTimeSlot || !selectedDate) return;

    const row = changeTimePopupParams.row;

    // Build services array with updated time slot
    const services = row.services.map((svc) => {
      // Parse start time (e.g., "10:00") and calculate end time based on duration
      const [startHour, startMin] = newTimeSlot.split(":").map(Number);
      const durationMinutes = svc.durationMinutes || 30;
      const endDate = new Date(2000, 0, 1, startHour, startMin + durationMinutes);
      const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

      return {
        serviceItemId: svc.serviceItemId,
        date: selectedDate,
        employeeId: svc.employeeId?._id,
        timeSlot: {
          start: newTimeSlot,
          end: endTime,
        },
      };
    });

    try {
      setUpdatingId(row.appointmentId);
      setActionError("");
      await AppointmentsService.changeTimeSlot(
        row.appointmentId,
        services,
        i18n.language === "en" ? "en" : "ar"
      );
      // Refresh appointments after change
      const data = await ProviderAppointmentsService.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
      setChangeTimePopupParams({ row: null, open: false });
      setNewTimeSlot("");
      setSelectedDate("");
      setAvailableSlots([]);
    } catch (error: any) {
      console.error("Failed to change time slot:", error);
      const msg = error?.response?.data?.message || error?.message || t("errorOccurred");
      setActionError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleUpdateStatus(
    appointmentId: string,
    newStatus: "COMPLETED" | "CANCELLED" | "CONFIRMED",
  ): Promise<void> {
    try {
      setUpdatingId(appointmentId);
      setActionError("");

      await AppointmentsService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        i18n.language === "en" ? "en" : "ar",
      );

      setAppointments((prev) =>
        prev.map((item) =>
          item.appointmentId === appointmentId
            ? { ...item, status: newStatus as AppointmentStatus }
            : item,
        ),
      );
    } catch (error: any) {
      console.error("Failed to update appointment status:", error);
      const msg = error?.response?.data?.message || error?.message || t("errorOccurred");
      setActionError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  const renderActionOptions = (status?: AppointmentStatus) => {
    const current = (status || "").toUpperCase();

    if (current === "PENDING") {
      return (
        <>
          <option value="confirm">{t("confirmed")}</option>
          <option value="cancel">{t("cancel")}</option>
          <option value="changeTime">{t("changeTimeSlot")}</option>
        </>
      );
    }

    if (current === "CONFIRMED") {
      return (
        <>
          <option value="complete">{t("completed")}</option>
          <option value="cancel">{t("cancel")}</option>
        </>
      );
    }

    if (current === "COMPLETED") {
      return (
        <>
          <option value="cancel">{t("cancel")}</option>
          <option value="complete">{t("completed")}</option>
        </>
      );
    }

    if (current === "CANCELLED") {
      return (
        <>
          <option value="complete">{t("completed")}</option>
          <option value="cancel">{t("cancel")}</option>
        </>
      );
    }

    return (
      <>
        <option value="complete">{t("completed")}</option>
        <option value="cancel">{t("cancel")}</option>
      </>
    );
  };

  const handleConfirmCancel = async () => {
    if (!cancelPopupParams.row) return;
    const row = cancelPopupParams.row;
    setCancelPopupParams({ row: null, open: false });

    const current = (row.status || "").toUpperCase();

    if (current === "PENDING") {
      await handleCancel(row.appointmentId);
    } else {
      await handleUpdateStatus(row.appointmentId, "CANCELLED");
    }
  };

  const handleActionChange = async (
    value: string,
    row: ProviderAppointmentDto,
  ) => {
    if (!value) return;

    if (value === "cancel") {
      setCancelPopupParams({ row, open: true });
      return;
    }

    if (value === "complete") {
      await handleUpdateStatus(row.appointmentId, "COMPLETED");
    }

    if (value === "confirm") {
      await handleUpdateStatus(row.appointmentId, "CONFIRMED");
    }

    if (value === "changeTime") {
      await handleChangeTimeSlot(row);
    }
  };

  const user = getCurrentUser();
  const isEmployee = user?.role === UserRole.EMPLOYEE;

  return (
    <div
      className="w-full px-3 py-4 sm:px-4 md:p-6 max-w-[1100px] mx-auto bg-[#fcfcfc] min-h-screen font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
          {t("orders")}
        </h1>
        <p className="text-gray-400 text-[11px] sm:text-[12px]">
          {t("manageYourAppointmentsAndOrders")}
        </p>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{actionError}</p>
          <button
            onClick={() => setActionError("")}
            className="text-red-400 hover:text-red-600 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-start gap-3 mb-5 md:mb-6">
        <div className={`${commonClass} w-full sm:w-[300px] gap-2`}>
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full bg-transparent outline-none text-[13px] text-gray-600 placeholder-gray-300"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => {
              setShowDate(!showDate);
              setShowStatusMenu(false);
            }}
            className={`${commonClass} w-full sm:min-w-[130px] gap-2`}
          >
            <Calendar
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: themeGreen }}
            />
            <span className="text-[12px] text-gray-500 flex-grow font-medium text-start truncate">
              {appliedDateFrom ? appliedDateFrom : t("date")}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-300 transition-transform shrink-0 ${showDate ? "rotate-180" : ""
                }`}
            />
          </button>

          {showDate && (
            <div className="absolute z-40 mt-2 right-0 left-0 sm:left-auto sm:w-[260px] rounded-xl border border-gray-100 bg-white p-4 shadow-xl animate-in fade-in duration-200">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="font-bold text-gray-700 text-xs">
                    {t("filterByDate")}
                  </span>
                  <X
                    onClick={() => setShowDate(false)}
                    className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-300 uppercase mb-1 block">
                    {t("from")}
                  </label>
                  <input
                    type="date"
                    value={tempDateFrom}
                    onChange={(e) => setTempDateFrom(e.target.value)}
                    className="w-full rounded-md border border-gray-100 px-2 py-1.5 text-xs outline-none focus:border-[#79A66B]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-300 uppercase mb-1 block">
                    {t("to")}
                  </label>
                  <input
                    type="date"
                    value={tempDateTo}
                    onChange={(e) => setTempDateTo(e.target.value)}
                    className="w-full rounded-md border border-gray-100 px-2 py-1.5 text-xs outline-none focus:border-[#79A66B]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleClearDate}
                    className="flex-1 rounded-md border border-gray-50 py-2 text-[11px] text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    {t("clear")}
                  </button>
                  <button
                    onClick={handleApplyDate}
                    className="flex-1 rounded-md py-2 text-[11px] text-white transition-opacity"
                    style={{ backgroundColor: themeGreen }}
                  >
                    {t("apply")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowDate(false);
            }}
            className={`${commonClass} w-full sm:min-w-[120px] gap-2`}
          >
            <Filter
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: themeGreen }}
            />
            <span className="text-[12px] text-gray-500 font-medium flex-grow text-start truncate">
              {statusFilter === "ALL"
                ? t("allStatus")
                : statusLabel(statusFilter as AppointmentStatus, t)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-300 transition-transform shrink-0 ${showStatusMenu ? "rotate-180" : ""
                }`}
            />
          </button>

          {showStatusMenu && (
            <div className="absolute z-40 mt-2 right-0 left-0 sm:left-auto sm:w-48 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in duration-200">
              {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "PENDING"].map(
                (opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt);
                      setShowStatusMenu(false);
                      setPage(1);
                    }}
                    className="w-full text-right px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-between"
                    style={{
                      color: statusFilter === opt ? themeGreen : "#6b7280",
                    }}
                  >
                    <span className={statusFilter === opt ? "font-bold" : ""}>
                      {opt === "ALL"
                        ? t("all")
                        : statusLabel(opt as AppointmentStatus, t)}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="block xl:hidden space-y-3">
        {!loading &&
          paged.map((row) => (
            <div
              key={row.appointmentId}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap ${statusBadgeClass(
                    row.status,
                  )}`}
                >
                  {statusLabel(row.status, t)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="min-w-0">
                  <p className="text-gray-400 mb-1">{t("service")}</p>
                  <p className="text-gray-700 font-medium truncate">
                    {row.services?.[0]?.name || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-gray-400 mb-1">{t("serviceValue")}</p>
                  <div className="flex items-center gap-1 text-[13px] font-bold text-gray-800">
                    {row.price?.finalTotal ?? 0}
                    <SaudiRiyal className="w-3 h-3 text-gray-300 shrink-0" />
                  </div>
                </div>

                <div className="col-span-2 min-w-0">
                  <p className="text-gray-400 mb-1">{t("orderDate")}</p>
                  <p className="text-gray-600 text-[12px]" dir="ltr">
                    {formatDateTime(
                      row.date || row.services?.[0]?.date,
                      row.services?.[0]?.timeSlot,
                      i18n.language,
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {!isEmployee && (
                  <select
                    defaultValue=""
                    disabled={updatingId === row.appointmentId || ["COMPLETED", "CANCELLED"].includes((row.status || "").toUpperCase())}
                    onChange={async (e) => {
                      const value = e.target.value;
                      await handleActionChange(value, row);
                      e.target.value = "";
                    }}
                    className={`h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-[12px] text-gray-600 outline-none focus:border-[#79A66B] ${["COMPLETED", "CANCELLED"].includes((row.status || "").toUpperCase()) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">
                      {updatingId === row.appointmentId
                        ? "..."
                        : t("choseAction")}
                    </option>
                    {renderActionOptions(row.status)}
                  </select>
                )}

                <Button
                  onClick={() => setSelectedAppointment(row)}
                  variant="ghost"
                  className="w-full justify-center text-[#79A66B] text-[12px] font-medium gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t("appointments.view")}
                </Button>
              </div>
            </div>
          ))}

        {loading && (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-200 border-t-[#79A66B] rounded-full"></div>
          </div>
        )}

        {!loading && paged.length === 0 && (
          <div className="p-10 text-center text-gray-300 text-xs font-medium bg-white rounded-xl border border-gray-100">
            {t("noDataAvailable")}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden xl:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className={`w-full border-collapse ${isRTL ? "text-right" : "text-left"
              }`}
          >
            <thead>
              <tr className="bg-gray-50/30 border-b border-gray-50">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#79A66B]"
                  />
                </th>

                <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase">
                  {t("service")}
                </th>

                <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase text-center">
                  {t("orderStatus")}
                </th>

                {!isEmployee && (
                  <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase text-center">
                    {t("supportCenter.actions")}
                  </th>
                )}

                <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase text-center">
                  {t("orderDate")}
                </th>

                <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase">
                  {t("serviceValue")}
                </th>

                <th className="p-3 font-semibold text-gray-400 text-[11px] uppercase text-center">
                  {t("appointments.view")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {!loading &&
                paged.map((row) => (
                  <tr
                    key={row.appointmentId}
                    className="hover:bg-gray-50/50 transition-colors duration-150"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-[#79A66B]"
                      />
                    </td>

                    <td className="p-3 text-gray-700 font-medium text-[13px]">
                      {row.services?.[0]?.name || "—"}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusBadgeClass(
                          row.status,
                        )}`}
                      >
                        {statusLabel(row.status, t)}
                      </span>
                    </td>

                    {!isEmployee && (
                      <td className="p-3 text-center">
                        <select
                          defaultValue=""
                          disabled={updatingId === row.appointmentId || ["COMPLETED", "CANCELLED"].includes((row.status || "").toUpperCase())}
                          onChange={async (e) => {
                            const value = e.target.value;
                            await handleActionChange(value, row);
                            e.target.value = "";
                          }}
                          className={`h-9 min-w-[150px] rounded-lg border border-gray-200 bg-white px-3 text-[12px] text-gray-600 outline-none focus:border-[#79A66B] ${["COMPLETED", "CANCELLED"].includes((row.status || "").toUpperCase()) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <option value="">
                            {updatingId === row.appointmentId
                              ? "..."
                              : t("choseAction")}
                          </option>
                          {renderActionOptions(row.status)}
                        </select>
                      </td>
                    )}

                    <td
                      className="p-3 text-gray-400 text-[12px] text-center whitespace-nowrap"
                      dir="ltr"
                    >
                      {formatDateTime(
                        row.date || row.services?.[0]?.date,
                        row.services?.[0]?.timeSlot,
                        i18n.language,
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1 text-[14px] font-bold text-gray-800 whitespace-nowrap">
                        {row.price?.finalTotal ?? 0}
                        <SaudiRiyal className="w-3 h-3 text-gray-300" />
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <Button
                        onClick={() => setSelectedAppointment(row)}
                        variant="ghost"
                        className="text-[#79A66B] text-[12px] font-medium gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("appointments.view")}
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-200 border-t-[#79A66B] rounded-full"></div>
          </div>
        )}

        {!loading && paged.length === 0 && (
          <div className="p-12 text-center text-gray-300 text-xs font-medium">
            {t("noDataAvailable")}
          </div>
        )}
      </div>

      <div className="mt-5 md:mt-6 overflow-x-auto">
        <PaginationBar
          page={page}
          totalPages={lastPage}
          limit={rowsPerPage}
          disabled={loading}
          isRTL={isRTL}
          rowsOptions={[10, 20, 50]}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => setRowsPerPage(l)}
          scrollToTop={true}
        />
      </div>

      {selectedAppointment && (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          isOpen={true}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {cancelPopupParams.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {i18n.language === "ar" ? "إلغاء الحجز" : "Cancel Order"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {i18n.language === "ar"
                  ? "هل انت متأكد من الغاء الحجز؟"
                  : "Are you sure you want to cancel the order?"}
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setCancelPopupParams({ row: null, open: false })}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                >
                  {i18n.language === "ar" ? "تراجع" : "Cancel"}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-red-500/30"
                >
                  {i18n.language === "ar" ? "تأكيد" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {changeTimePopupParams.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                {i18n.language === "ar" ? "تغيير الفترة الزمنية" : "Change Time Slot"}
              </h3>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {i18n.language === "ar" ? "اختر التاريخ" : "Select Date"}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setNewTimeSlot("");
                    if (changeTimePopupParams.row) {
                      fetchSlotsForDate(changeTimePopupParams.row, e.target.value);
                    }
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Time Slots */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {i18n.language === "ar" ? "اختر الوقت" : "Select Time"}
                </label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    {i18n.language === "ar" ? "لا توجد فترات متاحة" : "No available slots"}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const isSelected = newTimeSlot === slot.time;
                      const isAvailable = slot.available;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setNewTimeSlot(slot.time)}
                          className={`px-2 py-2 text-xs rounded-lg border transition-all ${isSelected
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : isAvailable
                                ? "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                                : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                            }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {actionError && (
                <p className="text-red-500 text-xs mb-4 text-center">{actionError}</p>
              )}

              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    setChangeTimePopupParams({ row: null, open: false });
                    setNewTimeSlot("");
                    setSelectedDate("");
                    setAvailableSlots([]);
                    setActionError("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                >
                  {i18n.language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleConfirmChangeTimeSlot}
                  disabled={!newTimeSlot || updatingId === changeTimePopupParams.row?.appointmentId}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-emerald-500/30"
                >
                  {updatingId === changeTimePopupParams.row?.appointmentId
                    ? (i18n.language === "ar" ? "جاري..." : "Saving...")
                    : (i18n.language === "ar" ? "تأكيد" : "Confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;
