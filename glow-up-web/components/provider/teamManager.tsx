"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import MemberCard from "@/components/provider-team/MemberCard";
import MemberModal from "@/components/provider-team/MemberModal";
import { useProviderStore } from "@/store/providerStore";
import { employeesServices } from "@/integration/services/employees/employees.service";
import { filesService } from "@/integration/services/files/files.service";
import { getUserFriendlyErrorMessage } from "@/lib/errorMessages";
import {
  createEmptyMember,
  type TeamMemberForm,
} from "@/app/models/provider-team-types";
import type { WorkingHoursSchedule } from "@/store/providerStore";

type WorkFor = "MALE" | "FEMALE" | "BOTH";

interface TeamManagerProps {
  onRefresh?: () => void;
  providerWorkingHours?: WorkingHoursSchedule | null;
}

export default function TeamManager({
  onRefresh,
  providerWorkingHours: propWorkingHours,
}: TeamManagerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const {
    teamMembers,
    addTeamMember,
    updateTeamMember,
    workingHours: storeWorkingHours,
  } = useProviderStore() as any;

  // Use prop working hours (fetched from API) or fallback to store
  const providerWorkingHours = propWorkingHours || storeWorkingHours;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMemberForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isMongoObjectId = (v?: string) =>
    /^[a-fA-F0-9]{24}$/.test((v || "").trim());

  const onAdd = () => {
    setEditing(createEmptyMember());
    setError("");
    setOpen(true);
  };

  const onEdit = async (id: string) => {

    const m = teamMembers.find((x: any) => x.id === id);
    if (!m) return;

    // For existing employees, fetch additional details (phone, email, working hours)
    // Roles/capabilities are already loaded from /providers/me
    if (isMongoObjectId(id)) {
      try {
        const fullInfo = await employeesServices.getFullInfo(id);
        const employeeWithHours: TeamMemberForm = {
          ...m,
          phone: fullInfo.phone || m.phone || "",
          email: fullInfo.email || m.email || "",
          gender: fullInfo.employee.gender || m.gender,
          workFor: fullInfo.employee.workFor || m.workFor,
          workingHours: fullInfo.workingHours || undefined,
          useCustomHours: !!fullInfo.workingHours,
          active: fullInfo.isActive ?? m.active ?? false,
          roles: fullInfo.capabilities ? {
            canLogin: !!fullInfo.capabilities.canLogin,
            canViewBookings: !!fullInfo.capabilities.canViewOwnBookings,
            canViewStats: !!fullInfo.capabilities.canViewStatistics,
            canAddBreak: !!fullInfo.capabilities.canManageBreakTime,
          } : m.roles,
        };
        
        setEditing(employeeWithHours);
      } catch (e) {
        console.error("Failed to load employee details", e);
        setEditing(m);
      }
    } else {
      setEditing(m);
    }
    setError("");
    setOpen(true);
  };

  const onSave = async (saved: TeamMemberForm, profileFile?: File) => {
    try {
      setSaving(true);
      setError("");

      const providerId = (localStorage.getItem("providerId") || "").trim();
      if (!providerId) throw new Error("Missing providerId");
      const isExisting = isMongoObjectId(saved.id);

      if (isExisting) {
        await employeesServices.update(saved.id, {
          name: (saved.name || "").trim(),
          position: (saved.positionId || "").trim(),
          workFor: saved.workFor || "BOTH",
          gender: saved.gender,
          phone: (saved.phone || "").trim(),
          email: (saved.email || "").trim(),
          workingHours: saved.useCustomHours ? saved.workingHours : undefined,
          isActive: saved.active,
        });

        // Update employee capabilities
        await employeesServices.updateCapabilities(saved.id, {
          canLogin: saved.roles.canLogin,
          canViewOwnBookings: saved.roles.canViewBookings,
          canViewStatistics: saved.roles.canViewStats,
          canManageBreakTime: saved.roles.canAddBreak,
        });

        if (profileFile) {
          await filesService.uploadEmployeeProfile(saved.id, profileFile);
        }

        updateTeamMember(saved);
      } else {
        const created = await employeesServices.create(
          providerId,
          saved,
          saved.workFor || "BOTH",
        );

        if (profileFile) {
          await filesService.uploadEmployeeProfile(created.id, profileFile);
        }

        const memberWithRealId: TeamMemberForm = {
          ...saved,
          id: created.id,
        };

        addTeamMember(memberWithRealId);
      }

      setOpen(false);
      setEditing(null);

      if (onRefresh) onRefresh();
    } catch (e: any) {
      const errorMessage = getUserFriendlyErrorMessage(e, { 
        isRTL,
        defaultMessage: isRTL ? "فشل في الحفظ" : "Failed to save"
      });
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div dir={isRTL ? "rtl" : "ltr"} className="mt-4 flex">
        <button
          type="button"
          onClick={onAdd}
          className={`flex items-center gap-2 rounded-[14px] border border-gray-200 bg-white px-4 py-2 text-sm font-medium ${
            isRTL ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border">
            +
          </span>
          {t("provider.providerTeam.add")}
        </button>
      </div>

      {error && (
        <p
          className={`mt-2 text-sm text-red-600 font-medium ${isRTL ? "text-right" : "text-left"}`}
        >
          {error}
        </p>
      )}

      <div className="mt-3 space-y-3">
        {teamMembers.map((m: any) => (
          <MemberCard
            key={m.id}
            member={{
              id: m.id,
              name: m.name,
              avatarUrl: m.avatarUrl,
              subtitle: m.positionLabel || m.jobTitle || m.positionId,
              active: m.active,
            }}
            onClick={() => onEdit(m.id)}
            onMenu={() => router.push(`/admin-dashboard/team/${m.id}`)}
          />
        ))}
      </div>

      {open && editing && (
        <MemberModal
          member={editing}
          providerWorkingHours={providerWorkingHours}
          saving={saving}
          externalError={error}
          onClose={() => {
            setOpen(false);
            setEditing(null);
            setError("");
          }}
          onSave={onSave}
        />
      )}
    </div>
  );
}
