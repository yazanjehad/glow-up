"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import TeamMembers, { type Member } from "../../../components/team/TeamMembers";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { employeesServices } from "@/integration/services/employees/employees.service";
import type { EmployeeDto } from "@/integration/services/employees/employees.types";
import { useBookingStore } from "@/store/bookingStore";

/** Backend often returns this in Arabic regardless of Accept-Language */
const NO_EMPLOYEES_FOR_SERVICE_AR =
  "لا يوجد موظفون لهذه الخدمة في هذا الصالون";

function messageForEmployeesError(
  raw: string | undefined,
  lang: string,
  t: (key: string) => string,
): string {
  const msg = (raw || "").trim();
  if (!msg) return t("teamPage.loadEmployeesFailed");

  const isNoEmployeesCase =
    msg === NO_EMPLOYEES_FOR_SERVICE_AR ||
    msg.includes("لا يوجد موظفين لهذه الخدمة");

  if (isNoEmployeesCase) {
    return t("teamPage.noEmployeesForService");
  }

  const hasArabic = /[\u0600-\u06FF]/.test(msg);
  const wantEnglish = lang.startsWith("en");
  if (hasArabic && wantEnglish) {
    return t("teamPage.loadEmployeesFailed");
  }

  return msg;
}


function buildImageUrl(path?: string): string {
  if (!path) return "";
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) return cleanPath;
  return `https://api-staging.theglowhub.com.sa/files/public?path=${encodeURIComponent(cleanPath)}`;
}

function mapEmployeesToMembers(employees: EmployeeDto[]): Member[] {
  return employees.map((e, idx) => ({
    id: e.id,
    name: e.name,
    rating: e.averageRating?.toFixed(1) || "—",
    reviews: String(e.totalRatings || 0),
    img: buildImageUrl(e.profileImage),
    active: idx === 0,
  }));
}

export default function Page() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProviderID, selectedServiceID, hasHydrated } = useBookingStore();

  // Redirect to home if no provider or service selected (e.g., page refresh)
  useEffect(() => {
    if (hasHydrated && (!selectedProviderID || !selectedServiceID)) {
      router.replace("/home");
    }
  }, [selectedProviderID, selectedServiceID, router, hasHydrated]);

  useEffect(() => {
  let cancelled = false;

  if (!selectedProviderID) {
    setError("missingProvider");
    setLoading(false);
    return;
  }

  if (!selectedServiceID) {
    setError("missingService");
    setLoading(false);
    return;
  }

  (async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesServices.listByProviderByService(
        selectedProviderID,
        selectedServiceID,
        lang,
      );
      if (!cancelled) setEmployees(data);
    } catch (e: any) {
      const raw =
        e?.response?.data?.message || e?.response?.data?.error || e?.message;
      const msg = messageForEmployeesError(
        typeof raw === "string" ? raw : undefined,
        lang,
        t,
      );
      if (!cancelled) setError(msg);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [selectedProviderID, selectedServiceID, lang, t]);


  const members: Member[] = useMemo(
    () => mapEmployeesToMembers(employees),
    [employees],
  );

  return (
    <Layout>
      <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center p-4 gap-8">
        <div className="w-full max-w-[46rem]">
          <TopBar
            titleKey="header.specialists"
            iconAriaLabelKey="teamPage.icon"
            icon={<ChevronArrow />}
          />
        </div>

        {loading ? (
          <div className="w-full max-w-[44rem] bg-white rounded-[20px] p-6 shadow-sm">
            {t("teamPage.loadingEmployees")}
          </div>
        ) : error ? (
          <div className="w-full max-w-[44rem] bg-white rounded-[20px] p-6 shadow-sm text-red-600">
            {error === "missingProvider"
              ? t("teamPage.missingProvider")
              : error === "missingService"
                ? t("teamPage.missingService")
                : error}
          </div>
        ) : (
          <TeamMembers
            providerId={selectedProviderID}
            members={members}
            className="w-full max-w-[44rem] h-96 overflow-y-auto"
            cardClassName="w-37 h-40"
            containerClassName="flex-wrap"
          />
        )}
      </main>
    </Layout>
  );
}
