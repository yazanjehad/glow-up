import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BookingStore = {
  servicesIDS: string[];
  clearServicesIDS: () => void;
  unSelectedServiceID: (id: string) => void;
  toggeleServiceID: (id: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  providerID: string;
  setProviderID: (v: string) => void;
  selectedEmployeeID: string;
  setSelectedEmployeeID: (v: string) => void;
  selectedServiceID: string;
  setSelectedServiceID: (v: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};
export const useServicesStore = create<BookingStore>()(
  persist(
    (set) => ({
      servicesIDS: [],
      clearServicesIDS: () => set({ servicesIDS: [] }),
      notes: "",
      setNotes: (v) => set({ notes: v }),
      unSelectedServiceID: (id: string) =>
        set((state) => ({
          servicesIDS: state.servicesIDS.filter((serviceID) => serviceID !== id),
        })),
      toggeleServiceID: (id: string) =>
        set((state) => ({
          servicesIDS: state.servicesIDS.includes(id)
            ? state.servicesIDS.filter((serviceID) => serviceID !== id)
            : [...state.servicesIDS, id],
        })),
      providerID: "",
      setProviderID: (v) => set({ providerID: v }),
      selectedEmployeeID: "",
      setSelectedEmployeeID: (v) => set({ selectedEmployeeID: v }),
      selectedServiceID: "",
      setSelectedServiceID: (v) => set({ selectedServiceID: v }),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "services-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);


