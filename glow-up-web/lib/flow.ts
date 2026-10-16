export const flowMap = {
  home: {
    salon: (salonId: string) => `/salon/${salonId}`,
  },

  bookingFor: {
    page: () => `/booking-for`,
  },

  bookingGift: {
    page: () => `/booking-gift`,
  },

  team: {
    page: () => `/team`,
  },
  services: {
    page: () => `/services`,
  },
  booking_slot: {
    page: () => `/booking-slot`,
  },

  booking_details: {
    page: () => `/booking-details`,
  },

  payment_details: {
    page: () => `/payment-details`,
  },

  booking_success: {
    page: () => `/booking-success`,
  },
  SalonProfileProvider: {
    page: () => `/provider/salon-profile`,
  },
  SalonServiceProvider: {
    page: () => `/provider/salon-service`,
  },
  activityType: {
    page: () => `/provider/activityType`,
  },
  SalonProfile: {
    page: (salonId: string) => `/provider/salon-profile/${salonId}`,
  },
  salon_service: {
    page: (salonId: string) => `/provider/salon-service/${salonId}`,
  },
  location: {
    page: () => `/provider/location`,
  },
  workingHours: {
    page: () => `/provider/workingHours`,
  },
  service: {
    page: () => `/provider/service`,
  },
  packages: {
    page: () => `/provider/packages`,
  },
  upload_images: {
    page: () => `/provider/upload-images`,
  },
  documents: {
    page: () => `/provider/documents`,
  },
  provider_team: {
    page: () => `/provider/provider-team`,
  },
  provider_profile: {
    page: () => `/provider/provider-profile`,
  },
};
