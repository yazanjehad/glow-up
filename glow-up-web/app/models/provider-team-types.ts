import type { WorkingHoursSchedule } from "@/store/providerStore";

export type TeamTab = "basic" | "login" | "hours";

export type RoleKey =
  | "canLogin"
  | "canViewBookings"
  | "canViewStats"
  | "canAddBreak";

export type MemberRoles = Record<RoleKey, boolean>;

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  jobTitle: string;
  positionId?: string;
  positionLabel?: string;
  active: boolean;
  avatarUrl?: string;
  phone?: string;
  roles: MemberRoles;
  workingHours?: WorkingHoursSchedule;
  useCustomHours?: boolean;
  gender?: "MALE" | "FEMALE";
  workFor?: "MALE" | "FEMALE" | "BOTH";
  createdAt?: string;
  updatedAt?: string;
}

export type TeamMemberForm = TeamMember;

export const DEFAULT_MEMBER_ROLES: MemberRoles = {
  canLogin: true,
  canViewBookings: true,
  canViewStats: false,
  canAddBreak: false,
};

export const createEmptyMember = (): TeamMemberForm => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()),

  name: "",
  email: "",
  jobTitle: "",

  positionId: "",
  positionLabel: "",

  active: true,
  avatarUrl: "",

  phone: "",
  roles: { ...DEFAULT_MEMBER_ROLES },
  workingHours: undefined,
  useCustomHours: false,
  gender: "MALE",
  workFor: "BOTH",
});
