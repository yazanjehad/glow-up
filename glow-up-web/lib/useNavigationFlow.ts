"use client";

import { useRouter } from "next/navigation";
import { flowMap } from "./flow";

export const useNavigationFlow = () => {
  const router = useRouter();

  return {
    goToSalon: (salonId: string) => {
      router.push(flowMap.home.salon(salonId));
    },

    goToBookingFor: () => {
      router.push(flowMap.bookingFor.page());
    },

    goToBookingGift: () => {
      router.push(flowMap.bookingGift.page());
    },

    goToTeamPage: () => {
      router.push(flowMap.team.page());
    },
    goToServicesPage: () => {
      router.push(flowMap.services.page());
    },
    goToBookingSlot: (id: string) => {
      router.push(`${flowMap.booking_slot.page()}/${id}`);
    },
    goToBookingDetails: () => {
      router.push(flowMap.booking_details.page());
    },

    goToPaymentDetails: () => {
      router.push(flowMap.payment_details.page());
    },

    goToBookingSuccess: () => {
      router.push(flowMap.booking_success.page());
    },
    goToSalonProfileProvider: () => {
      router.push(flowMap.SalonProfileProvider.page());
    },
    goToSalonServiceProvider: () => {
      router.push(flowMap.SalonServiceProvider.page());
    },
    goToProviderActivityType: () => {
      router.push(flowMap.activityType.page());
    },
    goToProviderLocation: () => {
      router.push(flowMap.location.page());
    },
    goToProviderWorkingHours: () => {
      router.push(flowMap.workingHours.page());
    },
    goToProviderService: () => {
      router.push(flowMap.service.page());
    },
    goToProviderPackages: () => {
      router.push(flowMap.packages.page());
    },
    goToProviderUploadImages: () => {
      router.push(flowMap.upload_images.page());
    },
    goToProviderDocuments: () => {
      router.push(flowMap.documents.page());
    },
    goToProviderTeam: () => {
      router.push(flowMap.provider_team.page());
    },
    goToProviderProfile: () => {
      router.push(flowMap.provider_profile.page());
    },

    // Admin routes
    goToAdminLogin: () => {
      router.push("/admin/login");
    },
    goToAdminDashboard: () => {
      router.push("/admin-dashboard");
    },
    goToSuperAdminDashboard: () => {
      router.push("/super-admin-dashboard");
    },
  };
};
