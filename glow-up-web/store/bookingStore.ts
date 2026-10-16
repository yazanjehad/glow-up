import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking, BookingStatus } from "@/app/models/my-booking-types";

export type BookingStore = {
  selectedServiceID: string;
  setSelectedServiceID: (v: string) => void;

  selectedEmployeeID: string;
  setSelectedEmployeeID: (v: string) => void;

  selectedDate: string;  
  setSelectedDate: (v: string) => void;

  selectedTimeSlot: { start: string; end: string };
  setSelectedTimeSlot: (v: { start: string; end: string }) => void;

  selectedProviderID: string;
  setSelectedProviderID: (v: string) => void;
  
  providerServices: any[];
  setProviderServices: (v: any[]) => void;

  providerPackages: any[];
  setProviderPackages: (v: any[]) => void;

  bookingFor: string;
  setBookingFor: (v: string) => void;

  notes: string;
  setNotes: (v: string) => void;

  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;

  selectedUserPackageId: string | null;
  setSelectedUserPackageId: (v: string | null) => void;

  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};
export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      selectedServiceID: "",
      setSelectedServiceID: (v) => set({ selectedServiceID: v }),

      selectedEmployeeID: "",
      setSelectedEmployeeID: (v) => set({ selectedEmployeeID: v }),

      selectedDate: "", 
      setSelectedDate: (v) => set({ selectedDate: v }),

      selectedTimeSlot: { start: "", end: "" }, 
      setSelectedTimeSlot: (v) => set({ selectedTimeSlot: v }),

      selectedProviderID: "",
      setSelectedProviderID: (v) => set({ selectedProviderID: v }),

      providerServices: [],
      setProviderServices: (v) => set({ providerServices: v }),

      providerPackages: [],
      setProviderPackages: (v) => set({ providerPackages: v }),

      bookingFor: "",
      setBookingFor: (v) => set({ bookingFor: v }),

      notes: "",
      setNotes: (v) => set({ notes: v }),

      paymentMethod: null,
      setPaymentMethod: (v) => set({ paymentMethod: v }),

      selectedUserPackageId: null,
      setSelectedUserPackageId: (v) => set({ selectedUserPackageId: v }),

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "booking-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);




type MyBookingsState = {
  byStatus: Partial<Record<BookingStatus, Booking[]>>;

  all: Booking[];

  loading: boolean;
  error: string | null;

  setStatusItems: (status: BookingStatus, items: Booking[]) => void;
  setAll: (items: Booking[]) => void;

  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;

  clear: () => void;
};

export const useMyBookingsStore = create<MyBookingsState>((set) => ({
  byStatus: {},
  all: [],
  loading: false,
  error: null,

  setStatusItems: (status, items) =>
    set((s) => ({
      byStatus: { ...s.byStatus, [status]: items },
    })),

  setAll: (items) => set({ all: items }),

  setLoading: (v) => set({ loading: v }),
  setError: (v) => set({ error: v }),

  clear: () => set({ byStatus: {}, all: [], loading: false, error: null }),
}));
