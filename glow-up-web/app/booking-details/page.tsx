"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import BookingDetailsClient from "@/components/booking-details/BookingDetailsClient";
import { useBookingStore } from "@/store/bookingStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";

export default function BookingDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMultiMode = searchParams?.get("mode") === "multi";
  const fromSuccess = searchParams?.get("from") === "success";

  const { selectedProviderID, hasHydrated: bookingHasHydrated } = useBookingStore();
  const { providerId: multiProviderId, hasHydrated: multiHasHydrated } = useMultiBookingStore();

  const providerId = isMultiMode ? multiProviderId : selectedProviderID;
  const anyHasHydrated = isMultiMode ? multiHasHydrated : bookingHasHydrated;

  // Redirect to home if no provider ID is available (e.g., page refresh)
  // Skip redirect if coming from success page (uses sessionStorage snapshot)
  useEffect(() => {
    if (anyHasHydrated && !fromSuccess && !providerId) {
      router.replace("/home");
    }
  }, [fromSuccess, providerId, router, anyHasHydrated]);



  return (
    <Layout>
      <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex justify-center">
        <div className="bookslot">
          {/* Top Bar */}
          <TopBar
            titleKey="bookingDetails.title"
            iconAriaLabelKey="bookingDetails.back"
            icon={<ChevronArrow />}
          />

          {/* Page Content - pb ensures "Proceed to Payment" is never cut off */}
          <div className="w-full max-w-[700px] px-4 py-4 pb-10">
            <BookingDetailsClient hideGoToPay={fromSuccess} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
