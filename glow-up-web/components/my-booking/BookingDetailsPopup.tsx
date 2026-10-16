"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Booking } from "@/app/models/my-booking-types";
import { StatusLine } from "./BookingCard";
import { Calendar, Clock, MapPin, User, SaudiRiyal } from "lucide-react";

const locale = (lang: string) => (lang === "ar" ? "ar-SA" : "en-GB");



function formatWeekday(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale(lang), { weekday: "long" }).format(d);
}

function formatDateOnly(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale(lang), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function formatTimeRangeHours(start?: string, end?: string, lang?: string): string {
  if (!start && !end) return "";
  const locale = lang === "ar" ? "ar-SA" : "en-GB";
  const fmt = (t: string) => {
    const part = t.trim().slice(0, 5);
    const [h, m] = part.split(":").map(Number);
    if (Number.isNaN(h)) return "";
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(2000, 0, 1, h, m ?? 0, 0));
  };
  const s = fmt(start ?? "");
  const e = fmt(end ?? "");
  if (s && e) return `${s} - ${e}`;
  return s || e;
}

type Props = {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BookingDetailsPopup({
  booking,
  open,
  onOpenChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = i18n.language;

  if (!booking) return null;

  const timeRange = formatTimeRangeHours(booking.timeSlot?.start, booking.timeSlot?.end, lang);
  const timeDisplay = timeRange || "—";
  const hasSalonOrStaff =
    (booking.providerName ?? "").trim() !== "" ||
    (booking.employeeName ?? "").trim() !== "";

  const rawServices = booking.services ?? [];
  const hasServicesFromApi = rawServices.length > 0;
  const displayServices = hasServicesFromApi
    ? rawServices
    : booking.title
      ? [{ name: booking.title, durationMinutes: booking.totalDurationMinutes ?? undefined, price: undefined as number | undefined }]
      : [];
  const sectionLabel = "text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "sm:max-w-[400px] max-h-[90vh] overflow-hidden p-0 gap-0",
          "rounded-2xl border border-neutral-200 shadow-xl bg-white"
        )}
      >
        <div className="border-b border-neutral-100 px-5 pt-4 pb-3 bg-white">
          <div className="h-0.5 w-8 rounded-full bg-emerald-500 mb-3" />
          <DialogHeader className="p-0">
            <DialogTitle
              className={cn(
                "text-base font-bold text-neutral-900",
                isRTL ? "text-right" : "text-left"
              )}
            >
              {t("bookings.details_title")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-5 py-4 space-y-5">
          <div
            className={cn(
              "flex gap-4 rounded-xl bg-neutral-50/80 p-4 border border-neutral-100",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-100">
              {booking.imageUrl ? (
                <Image
                  src={booking.imageUrl}
                  alt={booking.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                  <div className="h-8 w-8 rounded-lg bg-neutral-200" />
                </div>
              )}
            </div>
            <div className={cn("min-w-0 flex-1", isRTL ? "text-right" : "text-left")}>
              {booking.providerName && (
                <p className="text-[17px] font-bold text-neutral-900 leading-tight">
                  {booking.providerName}
                </p>
              )}
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2 mt-1.5",
                  isRTL ? "flex-row-reverse justify-end" : "flex-row justify-start"
                )}
              >
                <p className="text-[13px] text-neutral-600 font-medium truncate">
                  {booking.title}
                </p>
                <StatusLine booking={booking} />
              </div>
            </div>
          </div>

          <div className={cn(isRTL ? "text-right" : "text-left")}>
            <p className={sectionLabel}>{t("bookings.section_datetime")}</p>
            <div className="space-y-2 rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 bg-white border-b border-neutral-100",
                  isRTL && "flex-row-reverse"
                )}
              >
                <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {t("bookings.day")}
                  </p>
                  <p className="text-[13px] font-medium text-neutral-800">
                    {booking.date ? formatWeekday(booking.date, lang) : "—"}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 bg-white border-b border-neutral-100",
                  isRTL && "flex-row-reverse"
                )}
              >
                <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {t("bookings.date")}
                  </p>
                  <p className="text-[13px] font-medium text-neutral-800">
                    {booking.date ? formatDateOnly(booking.date, lang) : "—"}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 bg-white",
                  isRTL && "flex-row-reverse"
                )}
              >
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {t("bookings.time")}
                  </p>
                  <p className="text-[13px] font-medium text-neutral-800">
                    {timeDisplay}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {hasSalonOrStaff && (
            <div className={cn(isRTL ? "text-right" : "text-left")}>
              <p className={sectionLabel}>{t("bookings.section_venue")}</p>
              <div className="space-y-2">
                {booking.providerName && (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 border border-neutral-100",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-neutral-500" />
                    <span className="text-[13px] font-medium text-neutral-800">
                      {booking.providerName}
                    </span>
                  </div>
                )}
                {booking.employeeName && (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 border border-neutral-100",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <User className="h-4 w-4 shrink-0 text-neutral-500" />
                    <span className="text-[13px] font-medium text-neutral-800">
                      {booking.employeeName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {displayServices.length > 0 && (
            <div className={cn(isRTL ? "text-right" : "text-left")}>
              <p className={sectionLabel}>{t("bookings.services")}</p>
              <ul className="space-y-3">
                {displayServices.map((s, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-xl border border-neutral-100 overflow-hidden bg-white shadow-sm",
                      isRTL && "text-right"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 bg-neutral-50/80 text-[13px]",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <span className="font-semibold text-neutral-800 truncate min-w-0">
                        {s.name}
                      </span>
                      {s.durationMinutes != null && (
                        <span className="flex items-center gap-1.5 text-neutral-500 shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                          {s.durationMinutes} {t("bookings.minutes")}
                        </span>
                      )}
                    </div>
                    {s.price != null && (
                      <div
                        className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50/80 border-t border-emerald-100/50 text-[14px] font-bold text-emerald-700",
                          isRTL && "flex-row-reverse"
                        )}
                      >
                        <SaudiRiyal className="h-4 w-4 shrink-0" />
                        {s.price}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
