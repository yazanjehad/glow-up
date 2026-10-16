"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { EmployeeUi } from "@/integration/services/provider/provider.types";
import { employeesService } from "@/integration/services/admin/employees.service";

export interface Member {
  id: string;
  name: string;
  rating?: {
    average: number;
    count: number;
  };
  reviews: string;
  img: string;
  active: boolean;
}

interface TeamMemberViewOnlyProps {
  members: EmployeeUi[];
  salonId: string;
  className?: string;
  /** When provided, used for navigation instead of /salon/[id]/employee/[employeeId] (e.g. super-admin path) */
  getEmployeeHref?: (salonId: string, employeeId: string) => string;
}

function displayName(name: unknown): string {
  if (name == null) return "";
  if (typeof name === "string") return name;
  if (typeof name === "object" && name !== null && "name" in name) {
    const n = (name as { name?: unknown }).name;
    return typeof n === "string" ? n : displayName(n);
  }
  return "";
}

function buildImageUrl(path?: string): string {
  if (!path) return "";
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  return `https://api-staging.theglowhub.com.sa/files/public?path=${encodeURIComponent(cleanPath)}`;
}

const TeamMemberViewOnly: React.FC<TeamMemberViewOnlyProps> = ({
  members,
  salonId,
  className = "",
  getEmployeeHref,
}) => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleMemberClick = (memberId: string) => {
    const path = getEmployeeHref
      ? getEmployeeHref(salonId, memberId)
      : `/salon/${salonId}/employee/${memberId}`;
    router.push(path);
  };

  return (
    <div
      className={`
        ${className} 
        p-6
        bg-white
        rounded-[20px]
        shadow-[0px_8px_32px_0px_#00000014]
      `}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {members.length === 0 && (
          <div className="col-span-full rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
            {isRTL ? "لا يوجد أعضاء فريق" : "No team members available"}
          </div>
        )}
        {members.map((member) => {
          const name = displayName(member.name);
          const imageUrl = buildImageUrl(member.img);
          const hasImage = !!imageUrl && !failedImages[member.id];
          return (
          <button
            key={member.id}
            onClick={() => handleMemberClick(member.id)}
            className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {/* Image */}
            <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-100">
              {hasImage ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [member.id]: true }))
                  }
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employeesService.getGenderIcon()}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {/* Name */}
            <h3 className="text-sm font-semibold text-gray-900 text-center leading-tight">
              {name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="text-blue-500 text-xs">
                ({member.rating?.count ?? 0})
              </span>

              <span className="text-xs font-semibold text-gray-800">
                {member.rating?.average !== undefined
                  ? member.rating.average.toFixed(1)
                  : "0"}
              </span>

              <Star size={14} className="text-orange-400 fill-orange-400" />
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamMemberViewOnly;