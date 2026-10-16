import { create } from "zustand";

type PackageStore = {
  packageIDs: string[];
  selectedPackageID?: string;

  togglePackageID: (id: string) => void;
  setPackageIDs: (ids: string[]) => void;
  setSelectedPackageID: (id: string) => void;
  unSelectPackageID: (id: string) => void;
  resetPackages: () => void;
};

export const usePackagesStore = create<PackageStore>((set) => ({
  packageIDs: [],
  selectedPackageID: undefined,

  togglePackageID: (id) =>
    set((state) => {
      const exists = state.packageIDs.includes(id);
      return {
        packageIDs: exists
          ? state.packageIDs.filter((x) => x !== id)
          : [...state.packageIDs, id],
      };
    }),

  setPackageIDs: (ids) => set({ packageIDs: ids }),

  setSelectedPackageID: (id) => set({ selectedPackageID: id }),

  unSelectPackageID: (id) =>
    set((state) => ({
      packageIDs: state.packageIDs.filter((x) => x !== id),
    })),

  resetPackages: () => set({ packageIDs: [], selectedPackageID: undefined }),
}));
