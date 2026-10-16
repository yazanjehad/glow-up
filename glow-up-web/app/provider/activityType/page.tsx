"use client";

import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import { ServiceTypeSelector } from "@/components/provider/TypeServiceCard";
import { useNavigationFlow } from "@/lib/useNavigationFlow";

const Page = () => {
  const nav = useNavigationFlow();

  return (
    <div>
      <HeaderProvider titleKey="activityType.title" subtitleKey="activityType.subtitle" />
      <ServiceTypeSelector onSelect={() => nav.goToSalonProfileProvider()} />
    </div>
  );
};

export default Page;
