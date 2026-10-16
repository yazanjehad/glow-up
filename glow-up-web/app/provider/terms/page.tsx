"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ProviderTermsPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"} 
      className="min-h-screen  pb-12 flex justify-center "
    >
      <main className="mt-8 w-[100%]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4">
          
              
              <h1 className="text-lg font-bold text-gray-900 text-center">
                {t("provider.providerTerms.title")}
              </h1>
              
              <div className="w-10" />
            </div>
          </header>

          <div className="p-6 md:p-10">
            <section className="space-y-8">
              <div>
                <SectionTitle>
                  {t("provider.providerTerms.sections.acceptTitle")}
                </SectionTitle>
                <P>{t("provider.providerTerms.sections.acceptBody")}</P>
              </div>

              <hr className="border-gray-100" />

              <div>
                <SectionTitle>
                  {t("provider.providerTerms.sections.accountTitle")}
                </SectionTitle>
                <UL>
                  <li>{t("provider.providerTerms.sections.accountBullets.0")}</li>
                  <li>{t("provider.providerTerms.sections.accountBullets.1")}</li>
                  <li>{t("provider.providerTerms.sections.accountBullets.2")}</li>
                </UL>
              </div>

              <div>
                <SectionTitle>
                  {t("provider.providerTerms.sections.paymentTitle")}
                </SectionTitle>
                <UL>
                  <li>{t("provider.providerTerms.sections.paymentBullets.0")}</li>
                  <li>{t("provider.providerTerms.sections.paymentBullets.1")}</li>
                </UL>
              </div>

              <div>
                <SectionTitle>
                  {t("provider.providerTerms.sections.usageTitle")}
                </SectionTitle>
                <UL>
                  <li>{t("provider.providerTerms.sections.usageBullets.0")}</li>
                  <li>{t("provider.providerTerms.sections.usageBullets.1")}</li>
                  <li>{t("provider.providerTerms.sections.usageBullets.2")}</li>
                </UL>
              </div>

              <div>
                <SectionTitle>
                  {t("provider.providerTerms.sections.ipTitle")}
                </SectionTitle>
                <UL>
                  <li>{t("provider.providerTerms.sections.ipBullets.0")}</li>
                </UL>
              </div>

              <div className="rounded-xl bg-gray-50 p-6">
                <SectionTitle>
                  {t("provider.providerTerms.sections.disclaimerTitle")}
                </SectionTitle>
                <UL>
                  <li>{t("provider.providerTerms.sections.disclaimerBullets.0")}</li>
                  <li>{t("provider.providerTerms.sections.disclaimerBullets.1")}</li>
                </UL>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-lg font-bold text-gray-900">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-7 text-gray-600">
      {children}
    </p>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-3 ps-6 text-[15px] leading-7 text-gray-600 marker:text-blue-500">
      {children}
    </ul>
  );
}