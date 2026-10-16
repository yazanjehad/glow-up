import { HeroData } from "@/app/models/HeroData";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export function HeroSection({ data }: { data: HeroData }) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        <div className="flex-1 space-y-4 text-center lg:text-start">
          <div>
            <h1 className="font-extrabold text-[#79A66B] text-3xl md:text-[44px] font-inherit">
              {t("hero.appName")}
            </h1>

            <p className="mt-2 text-slate-600 text-2xl md:text-[44px] font-inherit leading-tight">
              {t("hero.title_line1")}
              <br className="hidden md:block" />
            </p>
            <p className="mt-2 text-slate-600 text-2xl md:text-[44px] font-inherit md:mx-14 lg:mx-28 leading-tight">
              {t("hero.title_line2")}
            </p>
          </div>

          <div className="flex justify-center lg:justify-start mt-8 md:mt-10 overflow-visible">
            <div className="flex flex-nowrap items-center justify-center gap-1 md:gap-3">
              <div className="flex flex-col items-center min-w-[80px] md:min-w-[140px]">
                <span className="text-[11px] md:text-[14px] text-slate-500 mb-1.5 md:mb-3 whitespace-nowrap">
                  {t("hero.numberOfClient")}
                </span>
                <span className="text-[#79A66B] text-[20px] md:text-[32px] font-bold leading-none">
                  <span>+</span>
                  {data.numberOfNewClients}
                </span>
              </div>
              
              <span className="mx-1.5 md:mx-8 lg:mx-14 h-10 md:h-16 w-px bg-slate-200 shrink-0" />

              <div className="flex flex-col items-center min-w-[80px] md:min-w-[140px]">
                <span className="text-[11px] md:text-[14px] text-slate-500 mb-1.5 md:mb-3 whitespace-nowrap">
                  {t("hero.numberOfSalon")}
                </span>
                <span className="text-[#79A66B] text-[20px] md:text-[32px] font-bold leading-none">
                  <span>+</span>
                  {data.numberOfSalons}
                </span>
              </div>
              
              <span className="mx-1.5 md:mx-8 lg:mx-14 h-10 md:h-16 w-px bg-slate-200 shrink-0" />

              <div className="flex flex-col items-center min-w-[80px] md:min-w-[140px]">
                <span className="text-[11px] md:text-[14px] text-slate-500 mb-1.5 md:mb-3 whitespace-nowrap">
                  {t("hero.numberOfBookings")}
                </span>
                <span className="text-[#79A66B] text-[20px] md:text-[32px] font-bold leading-none">
                  <span>+</span>
                  {data.numberOfBookings}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] flex justify-center mt-8 lg:mt-0">
          <div className="relative w-full max-w-[415px] aspect-[415/305]">
            <Image
              src={"/hero-illustration.png"}
              alt={t("glowup")}
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 415px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
