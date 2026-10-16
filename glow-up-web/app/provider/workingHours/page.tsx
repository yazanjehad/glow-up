"use client";

import { useTranslation } from "react-i18next";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";
import WorkingHoursComponent from "@/components/provider/WorkingHours";

export default function CreateSalonWorkingHours() {
  const { t } = useTranslation();
  const nav = useNavigationFlow();

  const { workingHours, updateWorkDay } = useProviderStore();

  const handleNext = () => {
    nav.goToProviderService();
  };

  const handleSkip = () => {
    nav.goToProviderService();
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <WorkingHoursComponent
        workingHours={workingHours}
        updateWorkDay={updateWorkDay}
        onNext={handleNext}
        onSkip={handleSkip}
        title={t("provider.workingHours.title")}
        subtitle={t("provider.workingHours.subtitle")}
      />
    </div>
  );
}
