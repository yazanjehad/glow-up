import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import SalonProfile from "@/components/provider/SalonProfile";
import React from "react";

const Page = () => {
  return (
    <div>
      <HeaderProvider
        titleKey="salonProfileProvider.title"
        subtitleKey="salonProfileProvider.subtitle"
      />

      <SalonProfile />
    </div>
  );
};

export default Page;
