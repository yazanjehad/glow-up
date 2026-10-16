"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

export default function BookingSuccess() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";

  const handleDetails = () => {
    let modeQuery = "";
    let appointmentIdQuery = "";
    try {
      const raw = sessionStorage.getItem("bookingSuccessSnapshot");
      const snap = raw ? JSON.parse(raw) : null;
      const mode = snap?.mode;
      const appointmentId = snap?.appointmentId;
      if (typeof mode === "string" && mode.trim()) {
        modeQuery = `&mode=${encodeURIComponent(mode)}`;
      }
      if (typeof appointmentId === "string" && appointmentId.trim()) {
        appointmentIdQuery = `&appointmentId=${encodeURIComponent(appointmentId)}`;
      }
    } catch {
      // ignore snapshot parsing issues
    }

    router.push(`/booking-details?from=success${modeQuery}${appointmentIdQuery}`);
  };

  const handleBookAnother = () => {
    router.push("/home");
  };

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="pt-8 md:pt-16 pb-10 flex w-full items-start justify-center px-4"
      >
        <div className="relative mx-auto w-full max-w-[520px] rounded-2xl bg-white p-5 md:p-8 shadow-lg">
          <div className="mt-1 flex justify-center">
            <div className="relative h-[70px] w-[70px]">
              <Image
                src="/done.png"
                alt="done"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h2 className="mt-4 text-center text-[22px] font-bold text-gray-900">
            {t("successModal.title")}
          </h2>

          <p className="mx-auto mt-2 max-w-[430px] text-center text-[14px] leading-6 text-gray-500">
            {t("successModal.desc")}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              type="button"
              onClick={handleBookAnother}
              className="h-10 rounded-lg bg-button-green px-5 text-white hover:bg-button-green/90"
            >
              {t("successModal.bookAnother")}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDetails}
              className="h-10 rounded-lg border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:text-[#000000]"
            >
              {t("successModal.details")}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
