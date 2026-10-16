"use client";

import { Check, X, SaudiRiyal } from "lucide-react";
import { useTranslation } from "react-i18next";

type Feature = { ok: boolean; textKey: string };

type Plan = {
  id: "free" | "popular" | "vip";
  badgeKey: string;
  badgeTone: "orange" | "green" | "blue";
  titleKey: string;
  price: number;
  periodKey: string;
  showPeriod?: boolean;
  features: Feature[];
  buttonKey: string;
  buttonDisabled?: boolean;
  cardVariant: "white" | "tint";
};

function DotBadge({
  tone,
  text,
}: {
  tone: "orange" | "green" | "blue";
  text: string;
}) {
  const map = {
    orange: { wrap: "bg-[#FFF4E8] text-[#F2994A]", dot: "bg-[#F2994A]" },
    green: { wrap: "bg-[#EAF4E7] text-[#4C8A3F]", dot: "bg-[#4C8A3F]" },
    blue: { wrap: "bg-[#EAF2FF] text-[#2F80ED]", dot: "bg-[#2F80ED]" },
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center justify-center gap-2",
        "w-[100px] h-[26px]",
        "rounded-full",
        "text-[12px] font-medium",
        map.wrap,
      ].join(" ")}
    >
      <span
        className={[
          "flex items-center justify-center rounded-full",
          "h-[14px] w-[14px]",
          map.dot,
        ].join(" ")}
      >
        <Check size={10} className="text-white" />
      </span>

      {text}
    </span>
  );
}

function PlanCard({
  plan,
  isRTL,
  t,
}: {
  plan: Plan;
  isRTL: boolean;
  t: (key: string) => string;
}) {
  const isTint = plan.cardVariant === "tint";
  const showPeriod = plan.showPeriod ?? true;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={[
        "w-full rounded-[14px] border p-4",
        "shadow-[0_14px_22px_-18px_rgba(0,0,0,0.45)]",
        isTint ? "border-[#D7E6D1] bg-[#F3F7F2]" : "border-gray-100 bg-white",
      ].join(" ")}
    >
      <div
        className={`flex flex-col gap-2 ${isRTL ? "text-right" : "text-left"}`}
      >
        <DotBadge tone={plan.badgeTone} text={t(plan.badgeKey)} />

        <div className="text-[20px] font-semibold text-gray-900">
          {t(plan.titleKey)}
        </div>

        <div className="flex items-end gap-1">
          <span className="text-[48px] font-extrabold text-gray-900 leading-none">
            {plan.price}
          </span>
          <SaudiRiyal size={18} className="text-gray-900 mb-[2px]" />

          {showPeriod ? (
            <div className="text-xs text-gray-500">/ {t(plan.periodKey)}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {plan.features.map((f, idx) => (
          <div
            key={idx}
            dir={isRTL ? "rtl" : "ltr"}
            className={`flex items-start gap-3 ${
              isRTL ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div className="pt-[2px] shrink-0">
              {f.ok ? (
                <Check size={16} className="text-[#79A66B]" />
              ) : (
                <X size={16} className="text-[#E25555]" />
              )}
            </div>

            <div
              className={`${isRTL ? "text-right" : "text-left"} text-xs leading-5 text-gray-400`}
            >
              {t(f.textKey)}
            </div>
          </div>
        ))}
      </div>

      <div
        className={[
          "mt-4 rounded-[10px] p-2",
          isTint ? "bg-[#EAF4E7]" : "bg-transparent",
        ].join(" ")}
      >
        <button
          type="button"
          disabled={plan.buttonDisabled}
          className={[
            "h-[44px] w-full rounded-[10px] text-sm font-medium transition",
            plan.buttonDisabled
              ? "bg-[#D9D9D9] text-[#8A8A8A] cursor-not-allowed"
              : "bg-[#79A66B] text-white hover:opacity-95",
          ].join(" ")}
        >
          {t(plan.buttonKey)}
        </button>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const plans: Plan[] = [
    {
      id: "free",
      badgeKey: "plans.free.badge",
      badgeTone: "orange",
      titleKey: "plans.free.title",
      price: 0,
      periodKey: "plans.period.month",
      showPeriod: false,
      cardVariant: "white",
      features: [
        { ok: true, textKey: "plans.features.oneServicePerMonth" },
        { ok: true, textKey: "plans.features.walletPayment" },
        { ok: false, textKey: "plans.features.discounts" },
        { ok: false, textKey: "plans.features.bookings" },
      ],
      buttonKey: "plans.free.button",
      buttonDisabled: true,
    },
    {
      id: "popular",
      badgeKey: "plans.popular.badge",
      badgeTone: "green",
      titleKey: "plans.popular.title",
      price: 30,
      periodKey: "plans.period.monthly",
      showPeriod: true,
      cardVariant: "tint",
      features: [
        { ok: true, textKey: "plans.features.oneServicePerMonth" },
        { ok: true, textKey: "plans.features.walletPayment" },
        { ok: true, textKey: "plans.features.discounts" },
        { ok: true, textKey: "plans.features.bookings" },
        { ok: true, textKey: "plans.features.freeSessions2Monthly" },
        { ok: true, textKey: "plans.features.freeSessions4OrWeekly" },
        { ok: true, textKey: "plans.features.oneGiftOrder" },
      ],
      buttonKey: "plans.choose",
    },
    {
      id: "vip",
      badgeKey: "plans.vip.badge",
      badgeTone: "blue",
      titleKey: "plans.vip.title",
      price: 55,
      periodKey: "plans.period.month",
      showPeriod: true,
      cardVariant: "tint",
      features: [
        { ok: true, textKey: "plans.features.oneServicePerMonth" },
        { ok: true, textKey: "plans.features.walletPayment" },
        { ok: true, textKey: "plans.features.discounts" },
        { ok: true, textKey: "plans.features.bookings" },
        { ok: true, textKey: "plans.features.freeSessions4Monthly" },
        { ok: true, textKey: "plans.features.freeSessions4OrWeeklyGift" },
        { ok: true, textKey: "plans.features.twoGiftOrders" },
      ],
      buttonKey: "plans.choose",
    },
  ];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full px-3 py-6 ${isRTL ? "text-right" : "text-left"}`}
    >
      <h1 className="mb-4 text-sm font-medium text-gray-900">{t("upgrade")}</h1>

      <div className="space-y-4">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} isRTL={isRTL} t={t} />
        ))}
      </div>
    </div>
  );
}
