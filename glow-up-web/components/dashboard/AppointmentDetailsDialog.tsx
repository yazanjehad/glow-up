"use client";

import React from "react";
import { X, Calendar, Clock, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaudiRiyal } from "lucide-react";
import type {
  ProviderAppointmentDto,
  AppointmentStatus,
} from "@/integration/services/provider/providerAppointments.service";

interface AppointmentDetailsDialogProps {
  appointment: ProviderAppointmentDto;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateTime = (iso?: string, t?: any) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

const formatTime = (time?: string) => {
  if (!time) return "—";
  return time;
};

const statusLabel = (s: AppointmentStatus, t: any) => {
  const v = (s || "").toUpperCase();
  if (v === "CONFIRMED") return t("confirmed");
  if (v === "COMPLETED") return t("completed");
  if (v === "CANCELLED") return t("cancelled");
  if (v === "PENDING") return t("pending");
  return s;
};

const statusBadgeClass = (s: AppointmentStatus) => {
  const v = (s || "").toUpperCase();
  if (v === "CONFIRMED")
    return "bg-emerald-50 text-emerald-600 border-emerald-100/50";
  if (v === "COMPLETED") return "bg-blue-50 text-blue-600 border-blue-100/50";
  if (v === "CANCELLED") return "bg-rose-50 text-rose-600 border-rose-100/50";
  if (v === "PENDING") return "bg-amber-50 text-amber-600 border-amber-100/50";
  return "bg-gray-50 text-gray-500 border-gray-100";
};

export default function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onClose,
}: AppointmentDetailsDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  if (!isOpen) return null;

  const date = appointment.date || appointment.services?.[0]?.date;
  const timeSlot = appointment.timeSlot || appointment.services?.[0]?.timeSlot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("coupons.appointmentDetails")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status & Order ID */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">{t("orderNumber")}</p>
              <p className="text-sm font-mono text-gray-700">
                {appointment.appointmentId}
              </p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusBadgeClass(appointment.status)}`}
            >
              {statusLabel(appointment.status, t)}
            </span>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#79A66B]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#79A66B]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  {t("appointments.customer")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.customerName || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#79A66B]" />
                <span className="text-xs text-gray-400">{t("date")}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(date, t)}
              </p>
            </div>

            {/* Time */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#79A66B]" />
                <span className="text-xs text-gray-400">{t("time")}</span>
              </div>
              <p className="text-sm font-medium text-gray-900" dir="ltr">
                {timeSlot
                  ? `${formatTime(timeSlot.start)} - ${formatTime(timeSlot.end)}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {t("services")}
            </p>
            <div className="space-y-2">
              {appointment.services?.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {service.name || "—"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>
                        {service.durationMinutes} {t("min")}
                      </span>
                      {service.employeeId?.name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {service.employeeId.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                    {service.price}
                    <SaudiRiyal className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#79A66B]" />
              <span className="text-sm text-gray-600">
                {t("totalDuration")}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {appointment.totalDurationMinutes} {t("min")}
            </span>
          </div>

          {/* Customer Note */}
          {appointment.customerNote && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-600 mb-1">{t("customerNote")}</p>
              <p className="text-sm text-gray-700">
                {appointment.customerNote}
              </p>
            </div>
          )}

          {/* Pricing */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("subtotal")}</span>
              <div className="flex items-center gap-1 text-gray-700">
                {appointment.price?.servicesTotal ?? 0}
                <SaudiRiyal className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            {(appointment.price?.discount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("discount")}</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  -{appointment.price?.discount}
                  <SaudiRiyal className="w-3 h-3" />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-gray-100">
              <span className="text-gray-900">{t("total")}</span>
              <div className="flex items-center gap-1 text-[#79A66B]">
                {appointment.price?.finalTotal ?? 0}
                <SaudiRiyal className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-6 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
