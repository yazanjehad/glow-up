import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ProviderService } from "@/app/models/provider-service-types";
import type { TeamMemberForm } from "@/app/models/provider-team-types";
import type { UploadedImage } from "@/app/models/upload-images.types";

export type GenderType = "men" | "women" | "both" | null;
export type ServiceModeValue = "STORE" | "HOME";
export type ServiceMode = ServiceModeValue[];
export type ServiceLocation = "home" | "salon" | "both" | null;

export type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type BreakItem = { id?: string; _id?: string; from: string; to: string };

export type WorkDay = {
  open: boolean;
  from: string;
  to: string;
  breaks?: BreakItem[];
};

export type WorkingHoursSchedule = Record<DayKey, WorkDay>;

export type ProviderPackageItem = { serviceItemId: string; quantity: number };

export type ProviderPackage = {
  id: string;
  name: string;
  desc?: string;
  price: number;
  items: ProviderPackageItem[];
};

export type ProviderFormData = {
  providerId: string;
  activityTypeId: string | null;
  salonName: string;
  salonEmail: string;
  salonPhone: string;
  salonDescription: string;
  salonNameEn: string;
  salonDescriptionEn: string;
  salonPolicy: string;
  salonPolicyEn: string;
  genderType: GenderType;
  serviceLocation: ServiceLocation;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  workingHours: WorkingHoursSchedule;
  services: ProviderService[];
  packages: ProviderPackage[];
  images: UploadedImage[];
  coverImage: UploadedImage | null;
  teamMembers: TeamMemberForm[];
};

export type ProviderStoreState = {
  providerId: string;
  setProviderId: (v: string) => void;

  activityTypeId: string | null;
  setActivityTypeId: (v: string | null) => void;

  coverImage: UploadedImage | null;
  setCoverImage: (v: UploadedImage | null) => void;

  salonName: string;
  setSalonName: (v: string) => void;
  salonEmail: string;
  setSalonEmail: (v: string) => void;
  salonPhone: string;
  setSalonPhone: (v: string) => void;
  salonDescription: string;
  setSalonDescription: (v: string) => void;
  salonNameEn: string;
  setSalonNameEn: (v: string) => void;
  salonDescriptionEn: string;
  setSalonDescriptionEn: (v: string) => void;
  salonPolicy: string;
  setSalonPolicy: (v: string) => void;
  salonPolicyEn: string;
  setSalonPolicyEn: (v: string) => void;

  genderType: GenderType;
  setGenderType: (v: GenderType) => void;

  serviceLocation: ServiceLocation;
  setServiceLocation: (v: ServiceLocation) => void;

  address: string;
  setAddress: (v: string) => void;

  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (v: { lat: number; lng: number } | null) => void;

  workingHours: WorkingHoursSchedule;
  setWorkingHours: (v: WorkingHoursSchedule) => void;
  updateWorkDay: (day: DayKey, value: WorkDay) => void;

  services: ProviderService[];
  setServices: (v: ProviderService[]) => void;
  addService: (v: ProviderService) => void;
  updateService: (v: ProviderService) => void;
  removeService: (id: string) => void;
  toggleServiceActive: (id: string, isActive: boolean) => void;

  resetServices: () => void;

  packages: ProviderPackage[];
  setPackages: (v: ProviderPackage[]) => void;
  addPackage: (v: ProviderPackage) => void;
  updatePackage: (v: ProviderPackage) => void;
  removePackage: (id: string) => void;

  images: UploadedImage[];
  setImages: (v: UploadedImage[]) => void;
  addImage: (v: UploadedImage) => void;
  updateImage: (id: string, data: Partial<UploadedImage>) => void;
  removeImage: (id: string) => void;

  teamMembers: TeamMemberForm[];
  setTeamMembers: (v: TeamMemberForm[]) => void;
  addTeamMember: (v: TeamMemberForm) => void;
  updateTeamMember: (v: TeamMemberForm) => void;
  removeTeamMember: (id: string) => void;

  selectedTeamMember: TeamMemberForm | null;
  setSelectedTeamMember: (v: TeamMemberForm | null) => void;

  reset: () => void;
  getAllData: () => ProviderFormData & {
    selectedTeamMember: TeamMemberForm | null;
  };
};

const DEFAULT_WORKING_HOURS: WorkingHoursSchedule = {
  sunday: { open: false, from: "10:00", to: "18:00" },
  monday: { open: true, from: "10:00", to: "18:00" },
  tuesday: { open: true, from: "10:00", to: "18:00" },
  wednesday: { open: true, from: "10:00", to: "18:00" },
  thursday: { open: true, from: "10:00", to: "18:00" },
  friday: { open: true, from: "10:00", to: "18:00" },
  saturday: { open: false, from: "10:00", to: "18:00" },
};

const initialState = {
  providerId: "",
  activityTypeId: null,
  salonName: "",
  salonEmail: "",
  salonPhone: "",
  salonDescription: "",
  salonNameEn: "",
  salonDescriptionEn: "",
  salonPolicy: "",
  salonPolicyEn: "",
  genderType: null,
  serviceLocation: null,
  address: "",
  coordinates: null,
  workingHours: DEFAULT_WORKING_HOURS,
  services: [] as ProviderService[],
  packages: [] as ProviderPackage[],
  images: [] as UploadedImage[],
  coverImage: null,
  teamMembers: [] as TeamMemberForm[],
  selectedTeamMember: null,
};

export const useProviderStore = create<ProviderStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProviderId: (v) => set({ providerId: v }),
      setActivityTypeId: (v) => set({ activityTypeId: v }),
      setCoverImage: (v) => set({ coverImage: v }),

      setSalonName: (v) => set({ salonName: v }),
      setSalonEmail: (v) => set({ salonEmail: v }),
      setSalonPhone: (v) => set({ salonPhone: v }),
      setSalonDescription: (v) => set({ salonDescription: v }),
      setSalonNameEn: (v) => set({ salonNameEn: v }),
      setSalonDescriptionEn: (v) => set({ salonDescriptionEn: v }),
      setSalonPolicy: (v) => set({ salonPolicy: v }),
      setSalonPolicyEn: (v) => set({ salonPolicyEn: v }),
      setGenderType: (v) => set({ genderType: v }),
      setServiceLocation: (v) => set({ serviceLocation: v }),

      setAddress: (v) => set({ address: v }),
      setCoordinates: (v) => set({ coordinates: v }),

      setWorkingHours: (v) => set({ workingHours: v }),
      updateWorkDay: (day, value) =>
        set((s) => ({ workingHours: { ...s.workingHours, [day]: value } })),

      setServices: (v) => set({ services: v }),

      addService: (v) =>
        set((s) => ({
          services: [...s.services, v],
        })),

      updateService: (v) =>
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id && v.id && svc.id === v.id ? v : svc
          ),
        })),

      removeService: (id) =>
        set((s) => ({
          services: s.services.filter((svc) => svc.id !== id),
        })),

      toggleServiceActive: (id, isActive) =>
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === id ? { ...svc, isActive } : svc
          ),
        })),

      resetServices: () => set({ services: [] }),

      setPackages: (v) => set({ packages: v }),
      addPackage: (v) => set((s) => ({ packages: [v, ...s.packages] })),
      updatePackage: (v) =>
        set((s) => ({
          packages: s.packages.map((p) => (p.id === v.id ? v : p)),
        })),
      removePackage: (id) =>
        set((s) => ({
          packages: s.packages.filter((p) => p.id !== id),
        })),

      setImages: (v) => set({ images: v }),
      addImage: (v) => set((s) => ({ images: [v, ...s.images] })),
      updateImage: (id, data) =>
        set((s) => ({
          images: s.images.map((img) =>
            img.id === id ? { ...img, ...data } : img
          ),
        })),
      removeImage: (id) =>
        set((s) => ({ images: s.images.filter((img) => img.id !== id) })),

      setTeamMembers: (v) => set({ teamMembers: v }),
      addTeamMember: (v) =>
        set((s) => ({ teamMembers: [v, ...s.teamMembers] })),
      updateTeamMember: (v) =>
        set((s) => ({
          teamMembers: s.teamMembers.map((m) => (m.id === v.id ? v : m)),
        })),
      removeTeamMember: (id) =>
        set((s) => ({
          teamMembers: s.teamMembers.filter((m) => m.id !== id),
        })),

      setSelectedTeamMember: (v) => set({ selectedTeamMember: v }),

      reset: () => {
        set(initialState);
        (useProviderStore as any).persist.clearStorage();
      },

      getAllData: () => {
        const state = get();
        return {
          providerId: state.providerId,
          activityTypeId: state.activityTypeId,
          salonName: state.salonName,
          salonEmail: state.salonEmail,
          salonPhone: state.salonPhone,
          salonDescription: state.salonDescription,
          salonNameEn: state.salonNameEn,
          salonDescriptionEn: state.salonDescriptionEn,
          salonPolicy: state.salonPolicy,
          salonPolicyEn: state.salonPolicyEn,
          genderType: state.genderType,
          serviceLocation: state.serviceLocation,
          address: state.address,
          coordinates: state.coordinates,
          workingHours: state.workingHours,
          services: state.services,
          packages: state.packages,
          images: state.images,
          coverImage: state.coverImage,
          teamMembers: state.teamMembers,
          selectedTeamMember: state.selectedTeamMember,
        };
      },
    }),
    {
      name: "provider-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);