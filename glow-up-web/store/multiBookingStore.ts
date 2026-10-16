import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MultiBookingItem, TimeSlot } from "@/app/models/multi-booking.types";

type MultiBookingState = {
  providerId: string;
  items: MultiBookingItem[];

  initFromServiceIds: (providerId: string, serviceIds: string[]) => void;

  setEmployee: (index: number, employeeId: string) => void;
  setDate: (index: number, date: string) => void;
  setTimeSlot: (index: number, slot: TimeSlot) => void;

  clearItem: (index: number) => void;
  reset: () => void;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};

export const useMultiBookingStore = create<MultiBookingState>()(
  persist(
    (set) => ({
      providerId: "",
      items: [],

      initFromServiceIds: (providerId, serviceIds) =>
        set((s) => {
          const prevByService = new Map(s.items.map((it) => [it.serviceId, it]));

          return {
            providerId,
            items: (serviceIds ?? []).map((sid) => {
              const prev = prevByService.get(sid);
              return (
                prev ?? {
                  serviceId: sid,
                  employeeId: "",
                  date: "",
                  timeSlot: { start: "", end: "" },
                }
              );
            }),
          };
        }),

      setEmployee: (index, employeeId) =>
        set((s) => ({
          items: s.items.map((it, i) => (i === index ? { ...it, employeeId } : it)),
        })),

      setDate: (index, date) =>
        set((s) => ({
          items: s.items.map((it, i) => (i === index ? { ...it, date } : it)),
        })),

      setTimeSlot: (index, slot) =>
        set((s) => ({
          items: s.items.map((it, i) =>
            i === index ? { ...it, timeSlot: slot } : it,
          ),
        })),

      clearItem: (index) =>
        set((s) => ({
          items: s.items.map((it, i) =>
            i === index
              ? { ...it, employeeId: "", date: "", timeSlot: { start: "", end: "" } }
              : it,
          ),
        })),

      reset: () => set({ providerId: "", items: [] }),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "multi-booking-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

