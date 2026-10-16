// store/lookupsStore.ts
import { create } from "zustand";
import type {
  LookupItemDto,
  LookupKey,
} from "@/integration/services/provider/lookups.types";
import { LookupsService } from "@/integration/services/provider/lookupsService";

type LookupsState = {
  items: LookupItemDto[];
  loading: boolean;
  error: string;

  loadAll: () => Promise<void>;

  getByKey: (key: LookupKey) => LookupItemDto[];
  getById: (id: string) => LookupItemDto | undefined;
};

export const useLookupsStore = create<LookupsState>((set, get) => ({
  items: [],
  loading: false,
  error: "",

  loadAll: async () => {
    if (get().items.length) return;

    try {
      set({ loading: true, error: "" });

      const items = await LookupsService.getAll();

      set({ items });
    } catch (e: any) {
      set({ error: e?.message || "Failed to load lookups" });
    } finally {
      set({ loading: false });
    }
  },

  getByKey: (key) => {
    return get().items.filter((x) => x.key === key && x.isActive);
  },

  getById: (id) => {
    return get().items.find((x) => x._id === id);
  },
}));
