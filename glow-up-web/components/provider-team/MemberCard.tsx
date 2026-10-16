"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { employeesService } from "@/integration/services/admin/employees.service";

interface MemberCardProps {
  member: {
    id: string;
    name: string;
    avatarUrl?: string;
    subtitle?: string;
    active?: boolean;
  };
  onClick?: () => void;
  onMenu?: () => void;
}

export default function MemberCard({
  member,
  onClick,
  onMenu,
}: MemberCardProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [imgError, setImgError] = useState(false);
  const imageSrc = member.avatarUrl || "";
  const showFallback = !imageSrc || imgError;

  const MenuButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onMenu?.();
      }}
      className="shrink-0 text-gray-400"
    >
      ⋮
    </button>
  );

  const Avatar = (
    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
      {!showFallback ? (
        <Image
          src={imageSrc}
          alt={member.name}
          width={40}
          height={40}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={employeesService.getGenderIcon()}
          alt={member.name}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );

  const TextBlock = (
    <div className={isRTL ? "text-right" : "text-left"}>
      <div className="flex items-center gap-2">
        <div className="text-[16px] font-semibold text-gray-900">
          {member.name}
        </div>
        {member.active !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              member.active
                ? "bg-green-50 text-green-600 border border-green-100"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            {member.active
              ? isRTL
                ? "نشط"
                : "Active"
              : isRTL
                ? "غير نشط"
                : "Inactive"}
          </span>
        )}
      </div>
      <div className="text-[14px] text-gray-500">{member.subtitle}</div>
    </div>
  );

  return (
    <div
      dir="ltr"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center rounded-[18px] border border-gray-200 bg-white px-4 py-4"
    >
      {isRTL ? (
        <>
          {MenuButton}
          <div className="ml-auto flex flex-row-reverse items-center gap-3">
            {Avatar}
            {TextBlock}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {Avatar}
            {TextBlock}
          </div>
          <div className="ml-auto">{MenuButton}</div>
        </>
      )}
    </div>
  );
}
