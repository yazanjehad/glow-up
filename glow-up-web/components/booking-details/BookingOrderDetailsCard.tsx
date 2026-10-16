"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SaudiRiyal, BadgePercent, ArrowLeft } from "lucide-react";
import type { BookingOrderDetails } from "@/app/models/booking-details-types";

type Props = {
  order: BookingOrderDetails;
  onApplyCoupon?: (code: string) => void;
  hideCouponInput?: boolean;
};

export default function BookingOrderDetailsCard({
  order,
  onApplyCoupon,
  hideCouponInput,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [coupon, setCoupon] = useState("");

  const formatMoney = (n?: number, variant: "muted" | "strong" = "muted") => {
    if (n == null) return null;

    const colorClass =
      variant === "strong" ? "text-gray-900" : "text-[#8B8A8A]";

    return (
      <span className={`inline-flex items-center gap-1 ${colorClass}`}>
        <span className="tabular-nums">{n}</span>
        <SaudiRiyal className={`h-4 w-4 ${colorClass}`} />
      </span>
    );
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="mx-auto w-full rounded-[24px] bg-white px-6 py-6 shadow-[0px_12px_40px_0px_#00000014]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px]  text-gray-900">
          {t("bookingDetails.orderDetails.title")}
        </h2>
      </div>

      <div className="mt-4 space-y-3">
        {order.services?.length
          ? order.services.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[14px] text-[#8B8A8A]">{s.name}</span>
              <span className="shrink-0 text-[14px] text-[#8B8A8A]">{formatMoney(s.price)}</span>
            </div>
          ))
          : null}
        {order.packages?.length
          ? order.packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[14px] text-[#8B8A8A]">{p.name}</span>
              <span className="shrink-0 text-[14px] text-[#8B8A8A]">{formatMoney(p.price)}</span>
            </div>
          ))
          : null}
        {!(order.services?.length || order.packages?.length) ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm text-[#8B8A8A]">
            {t("bookingDetails.orderDetails.empty")}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-gray-900">
          {t("bookingDetails.orderDetails.total")}
        </span>
        <span className="text-[16px] font-extrabold text-gray-900">
          {formatMoney(order.totalPrice, "strong")}
        </span>
      </div>

      {!hideCouponInput && (
        <>
          <p className="mt-5 text-[14px] text-[#8B8A8A]">
            {t("bookingDetails.orderDetails.haveCoupon")}
          </p>

          <div
            className="
        mt-2 flex items-center gap-[10px]
        w-full max-w-[633px] h-[48px]
        px-[14px] py-[10px]
        rounded-[20px]
        bg-[#E5E7EB]
        border border-[#E5E7EB]
      "
          >
            <BadgePercent className="h-5 w-5 shrink-0 text-gray-400" />

            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder={t("bookingDetails.orderDetails.couponPlaceholder")}
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            <button
              type="button"
              onClick={() => onApplyCoupon?.(coupon.trim())}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BABABA] hover:bg-[#AFAFAF]"
              aria-label="Apply coupon"
            >
              <span className="absolute h-5 w-5 rounded-full border-2 border-white" />
              <ArrowLeft
                className={`relative h-3 w-3 text-white  ${isRTL ? "" : "rotate-180"}`}
              />
            </button>
          </div>
        </>
      )}

      <div className="mt-6 space-y-3">
        {order.subtotal != null && (
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8B8A8A]">
              {t("bookingDetails.orderDetails.subtotal")}
            </span>
            <span className="text-[14px] text-gray-700">
              {formatMoney(order.subtotal)}
            </span>
          </div>
        )}

        {order.tax != null && (
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8B8A8A]">
              {t("bookingDetails.orderDetails.tax")}
            </span>
            <span className="text-[14px] text-gray-700">
              {formatMoney(order.tax)}
            </span>
          </div>
        )}

        {order.discount != null && (
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8B8A8A]">
              {t("bookingDetails.orderDetails.discount")}
            </span>
            <span className="text-[14px] text-gray-700">
              {formatMoney(order.discount)}
            </span>
          </div>
        )}

        <div className="pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-gray-900">
              {t("bookingDetails.orderDetails.total")}
            </span>
            <span className="text-[16px] font-extrabold text-gray-900">
              {formatMoney(order.totalPrice, "strong")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
