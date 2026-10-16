
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { SimpleCard } from "@/components/shared/simple-card";
import { useBookingStore } from "@/store/bookingStore";
import { useServicesStore } from "@/store/serviceStore";
import { usePackagesStore } from "@/store/packageStore";

export default function BookingForPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedProviderID, setSelectedProviderID, hasHydrated } = useBookingStore();
  const servicesIDS = useServicesStore((s) => s.servicesIDS);
  const packageIDs = usePackagesStore((s) => s.packageIDs);
  const id = searchParams?.get("id");

  // Sync provider ID from URL if missing in store
  useEffect(() => {
    if (id && !selectedProviderID && hasHydrated) {
      setSelectedProviderID(id);
    }
  }, [id, selectedProviderID, setSelectedProviderID, hasHydrated]);

  // Redirect to home if no provider selected and not in URL (e.g., page refresh without ID)
  useEffect(() => {
    // Only redirect if we don't have a provider ID in store AND we don't have an id in URL
    // And WAIT until the store has hydrated from localStorage
    if (hasHydrated && !selectedProviderID && !id) {
      router.replace("/home");
    }
  }, [selectedProviderID, id, router, hasHydrated]);

  const handleMyselfClick = () => {
    if (packageIDs && packageIDs.length > 0) {
      router.push("/payment-details?mode=package");
      return;
    }

    if (servicesIDS.length > 1) {
      router.push(`/booking-multi?id=${id || selectedProviderID}`);
    } else {
      router.push(`/team/${id || selectedProviderID}`);
    }
  };

  return (
    <Layout>
      <TopBar
        titleKey="bookingFor.title"
        iconAriaLabelKey="bookingFor.back"
        icon={<ChevronArrow />}
        iconHref={`/salon/${selectedProviderID}`}
      />
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <SimpleCard
                titleKey="bookingFor.myself"
                descriptionKey="bookingFor.myselfDescription"
                iconType="user"
                onClick={handleMyselfClick}
              />
              <SimpleCard
                titleKey="bookingFor.gift"
                descriptionKey="bookingFor.giftDescription"
                iconType="gift"
                onClick={() => router.push("/booking-gift")}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
