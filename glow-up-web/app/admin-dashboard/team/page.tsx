"use client";

import { useEffect, useState, useCallback } from "react";
import type { WorkingHoursSchedule } from "@/store/providerStore";
import { useTranslation } from "react-i18next";
import TeamManager from "../../../components/provider/teamManager";
import { useProviderStore } from "@/store/providerStore";
import { authServices } from "@/integration/services/auth/authServices";
import { TOKEN_KEY } from "@/app/models/constants";
import type { TeamMemberForm } from "@/app/models/provider-team-types";
import { DEFAULT_MEMBER_ROLES } from "@/app/models/provider-team-types";

type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const API_DAY_MAP: Record<string, DayKey> = {
  SUNDAY: "sunday",
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
};

function convertApiWorkingHours(apiHours: any): WorkingHoursSchedule | null {
  if (!apiHours?.weekly) return null;

  const schedule: Partial<WorkingHoursSchedule> = {};
  for (const item of apiHours.weekly) {
    const dayKey = API_DAY_MAP[item.day];
    if (dayKey) {
      schedule[dayKey] = {
        open: item.isOpen,
        from: item.openTime || "10:00",
        to: item.closeTime || "18:00",
      };
    }
  }

  const allDays: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  for (const day of allDays) {
    if (!schedule[day]) {
      schedule[day] = { open: false, from: "10:00", to: "18:00" };
    }
  }

  return schedule as WorkingHoursSchedule;
}

export default function UpdateTeamPage() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const setTeamMembers = useProviderStore((s) => s.setTeamMembers);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerWorkingHours, setProviderWorkingHours] =
    useState<WorkingHoursSchedule | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const providerId = (localStorage.getItem("providerId") || "").trim();
      const token = (localStorage.getItem(TOKEN_KEY) || "").trim();

      if (!providerId || !token) {
        setLoading(false);
        return;
      }

      // Fetch provider data including employees with capabilities
      const provider = await authServices.getProviderMe();

      // Set provider working hours
      if (provider?.workingHours) {
        const hours = convertApiWorkingHours(provider.workingHours);
        if (hours) setProviderWorkingHours(hours);
      }

      // Map employees from /providers/me response with their capabilities
      const employees = provider?.employees || [];

      const buildImageUrl = (path?: string) => {
        if (!path) return "";
        const cleanPath = path.replace(/^\//, "");
        if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
          return cleanPath;
        }

        return `https://api-staging.theglowhub.com.sa/files/public?path=${encodeURIComponent(cleanPath)}`;
      };

      const mapped: TeamMemberForm[] = employees.map((e: any) => {
        const roles = e.capabilities
          ? {
              canLogin: e.capabilities.canLogin ?? true,
              canViewBookings: e.capabilities.canViewOwnBookings ?? true,
              canViewStats: e.capabilities.canViewStatistics ?? false,
              canAddBreak: e.capabilities.canManageBreakTime ?? false,
            }
          : { ...DEFAULT_MEMBER_ROLES };

        return {
          id: e._id || e.id,
          name: e.name || "",
          email: "",
          jobTitle: e.position?.name?.[i18n.language] || e.position?.code || "",
          positionId: e.position?._id || "",
          positionLabel:
            e.position?.name?.[i18n.language] || e.position?.code || "",
          active: e.isActive ?? false,
          avatarUrl: buildImageUrl(e.profileImage || e.avatarUrl || e.avatar),
          phone: "",
          gender: e.gender,
          workFor: e.workFor,
          roles,
          workingHours: undefined,
          useCustomHours: false,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        };
      });
      setTeamMembers(mapped);
    } catch (e: any) {
      const is404 =
        e?.response?.status === 404 ||
        e?.status === 404 ||
        String(e).includes("404");

      if (!is404) {
        console.error("Failed to load team", e);
        setError(e?.message || "Failed to load team");
      }
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, [setTeamMembers, i18n.language]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam, i18n.language]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
      <header className="mb-8 px-1">
        <h2 className="text-[22px] font-semibold text-gray-900">
          {t("provider.providerTeam.title")}
        </h2>
        <p className="text-[13px] text-gray-400 mt-1">
          {isRTL
            ? "إدارة وتعديل أعضاء فريق العمل الخاص بك"
            : "Manage your team members and roles"}
        </p>
      </header>

      <div className="bg-white rounded-[28px] border border-gray-100/80 overflow-hidden">
        <div className="p-4 min-h-[300px] flex flex-col justify-center">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-500 animate-pulse">
              {t("loading") || "Loading..."}
            </div>
          ) : (
            <TeamManager
              onRefresh={loadTeam}
              providerWorkingHours={providerWorkingHours}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
