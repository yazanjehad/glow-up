"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import type { Booking } from "@/app/models/my-booking-types";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import BookingDetailsPopup from "./BookingDetailsPopup";
import {
  RatingsService,
  CreateRatingPayload,
} from "@/integration/services/Ratings/ratings.service";
import { AppointmentsService } from "@/integration/services/appointments/appointments.service";
import { toast } from "sonner";

export function StatusLine({ booking }: { booking: Booking }) {
  const { t } = useTranslation();

  if (booking.status === "current") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 ring-1 ring-inset ring-green-600/10">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span>{t("bookings.status.current")}</span>
      </div>
    );
  }

  if (booking.status === "previous") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 ring-1 ring-inset ring-green-600/10">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        <span>{t("bookings.status.previous")}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-inset ring-red-500/10">
      <AlertCircle className="h-3 w-3" />
      <span>{t("bookings.status.canceled")}</span>
    </div>
  );
}

function RatingForm({
  onSubmit,
  onCancel,
  placeholder,
}: {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
  placeholder: string;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit(rating, comment);
      setRating(5);
      setComment("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-white p-4 border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer transition-all duration-200 active:scale-75 ${star <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-neutral-200"}`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
      <textarea
        className="w-full rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-[13px] font-medium outline-none focus:border-[#6FA35D]/30 focus:ring-4 focus:ring-[#6FA35D]/5 text-black transition-all placeholder:text-neutral-400"
        placeholder={placeholder}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#6FA35D] py-3 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(111,163,93,0.2)] hover:bg-[#5E8E4F] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? (
             <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : t("bookings.send_rating") || "Send Rating"}
      </button>
    </div>
  );
}

export default function BookingCard({
  booking,
  employeeId: propEmployeeId,
  employeeName: propEmployeeName,
}: {
  booking: Booking;
  employeeId?: string;
  employeeName?: string;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const [activeRatingType, setActiveRatingType] = useState<
    "service" | "staff" | null
  >(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [ratedTypes, setRatedTypes] = useState<{
    service: boolean;
    staff: boolean;
  }>({
    service: false,
    staff: false,
  });
  const [detailsPopupOpen, setDetailsPopupOpen] = useState(false);

  const handleRateSubmit = async (rating: number, comment: string) => {
    const type = activeRatingType;
    if (!type) return;

    const payload: CreateRatingPayload = {
      appointmentId: booking.id,
      rating: rating,
    };

    if (comment.trim()) payload.comment = comment.trim();

    if (type === "staff") {
      const eId = propEmployeeId || booking.employeeId;
      if (!eId) {
        setRatedTypes((prev) => ({ ...prev, staff: true }));
        setActiveRatingType(null);
        return;
      }
      payload.employeeId = eId;
    }

    try {
      await RatingsService.createRating(payload);
      toast.success(t("bookings.rating_success") || "Success");
      setRatedTypes((prev) => ({ ...prev, [type]: true }));
      setActiveRatingType(null);
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      const isAlreadyRated = 
        errorCode === "Appointment already rated as employee" ||
        errorCode === "Appointment already rated" ||
        errorCode === "APPOINTMENT_ALREADY_RATED_AS_TYPE" ||
        errorCode === "APPOINTMENT_ALREADY_RATED";

      if (isAlreadyRated) {
        toast.info(t("bookings.already_rated") || "Already rated");
        setRatedTypes((prev) => ({ ...prev, [type]: true }));
        setActiveRatingType(null);
      } else if (errorCode === "Appointment not completed yet" || errorCode === "APPOINTMENT_NOT_COMPLETED") {
        toast.info(t("bookings.rate_when_completed") ?? "يمكنك التقييم بعد اكتمال الحجز من الصالون.");
      } else {
        toast.error(t("bookings.error_occurred") || "Error");
      }
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await AppointmentsService.cancelAppointment(
        booking.id,
        "User requested cancellation",
      );

      setIsDeleted(true);

      router.refresh();
    } catch (error: any) {
      toast.error(t("bookings.error_occurred") || "Error");
      setIsCancelling(false);
    }
  };

  if (isDeleted) return null;

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setDetailsPopupOpen(true)}
          className={[
            "flex min-w-0 flex-1 cursor-pointer items-center gap-3 outline-none focus:ring-0",
            isRTL ? "text-right" : "text-left",
          ].join(" ")}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {booking.imageUrl ? (
              <Image
                src={booking.imageUrl || ""}
                alt={booking.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-50">
                   <div className="h-6 w-6 rounded-full bg-neutral-200 animate-pulse" />
                </div>
            )}
          </div>
          <div
            className={["min-w-0 flex-1", isRTL ? "text-right" : "text-left"].join(
              " ",
            )}
          >
            {booking.providerName ? (
              <div className="truncate text-[14px] font-bold text-neutral-900 tracking-tight">
                {booking.providerName}
              </div>
            ) : null}
            <div className={cn(
              "truncate font-medium tracking-tight transition-colors group-hover:text-[#6FA35D]",
              booking.providerName ? "text-[12px] text-neutral-600 mt-0.5" : "text-[14px] font-bold text-neutral-900"
            )}>
              {booking.title}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <StatusLine booking={booking} />
              {booking.employeeName && (
                <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-neutral-200" />
                  {booking.employeeName}
                </span>
              )}
            </div>
          </div >
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {booking.status === "current" ? (
            <div className="flex items-center gap-1">
              {showConfirmCancel ? (
                <div
                  className={`flex items-center gap-2 animate-in duration-300 ${isRTL ? "slide-in-from-left-4" : "slide-in-from-right-4"}`}
                >
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="rounded-xl bg-red-600 px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isCancelling
                      ? "..."
                      : t("bookings.confirm_yes") || "Confirm"}
                  </button>
                  <button
                    onClick={() => setShowConfirmCancel(false)}
                    className="rounded-xl bg-neutral-100 px-4 py-2 text-[12px] font-bold text-neutral-600 hover:bg-neutral-200 transition-all active:scale-95"
                  >
                    {t("bookings.confirm_no") || "No"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(true)}
                  className="rounded-xl border border-red-50 bg-white px-3.5 py-2 text-[12px] font-bold text-red-500 shadow-sm hover:bg-red-50 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("bookings.cancel")}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl bg-[#6FA35D] px-5 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-[#6FA35D]/20 hover:bg-[#5E8E4F] hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95"
            >
              {t("bookings.rebook")}
            </button>
          )}
        </div>
      </div>


      {booking.status === "previous" && booking.canRate && (
        <div className="flex flex-col border-t border-gray-50 pt-3">
          <div className="flex items-center gap-2">
            {!ratedTypes.service && (
              <button
                onClick={() =>
                  setActiveRatingType(
                    activeRatingType === "service" ? null : "service",
                  )
                }
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all ${activeRatingType === "service" ? "bg-yellow-50 border-yellow-300" : "border-gray-100 text-gray-600 hover:bg-gray-50"}`}
              >
                <Star
                  className={`h-3 w-3 ${activeRatingType === "service" ? "fill-yellow-500 text-yellow-500" : "text-yellow-500"}`}
                />
                {t("bookings.rate_service")}
              </button>
            )}
            {!ratedTypes.staff && (
              <button
                onClick={() =>
                  setActiveRatingType(
                    activeRatingType === "staff" ? null : "staff",
                  )
                }
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all ${activeRatingType === "staff" ? "bg-yellow-50 border-yellow-300" : "border-gray-100 text-gray-600 hover:bg-gray-50"}`}
              >
                <Star
                  className={`h-3 w-3 ${activeRatingType === "staff" ? "fill-yellow-500 text-yellow-500" : "text-yellow-500"}`}
                />
                {t("bookings.rate_staff")}
              </button>
            )}
          </div>

          {activeRatingType && (
            <RatingForm
              placeholder={
                activeRatingType === "service"
                  ? t("bookings.service_placeholder")
                  : t("bookings.staff_placeholder")
              }
              onCancel={() => setActiveRatingType(null)}
              onSubmit={handleRateSubmit}
            />
          )}
        </div>
      )}

      <BookingDetailsPopup
        booking={booking}
        open={detailsPopupOpen}
        onOpenChange={setDetailsPopupOpen}
      />
    </div>
  );
}
