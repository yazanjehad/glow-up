"use client";

import Header from "@/components/shared/Header";
import StepHeader from "@/components/shared/StepHeader";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";

  const steps = [
    "/provider/activityType",
    "/provider/salon-profile",
    "/provider/salon-service",
    "/provider/location",
    "/provider/workingHours",
    "/provider/service",
    "/provider/packages",
    "/provider/upload-images",
    "/provider/documents",
  ];

  const isNarrowCard =
    pathname === "/provider/provider-login" ||
    pathname === "/provider/provider-profile" ||
    pathname === "/provider/terms";

  const showStepHeader = steps.includes(pathname) && !isNarrowCard;

  const stepIndex = steps.findIndex((p) => p === pathname);
  const step = stepIndex === -1 ? 1 : stepIndex + 1;
  const totalSteps = steps.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-gray-50">
        <Header />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex justify-center pt-8 pb-16">
          <main
            className={`w-full rounded-[20px] bg-white shadow-sm ${
              isNarrowCard ? "max-w-[520px] p-6" : "max-w-[820px] p-8"
            }`}
          >
            {showStepHeader ? (
              <>
                <StepHeader
                  step={step}
                  totalSteps={totalSteps}
                  onBack={() => window.history.back()}
                />
                <div className="mt-6">{children}</div>
              </>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
