"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import EmployeeCard from "./EmployeeCard";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useBookingStore } from "@/store/bookingStore";

export const ANY_EMPLOYEE_ID = "any";

function AnyEmployeeCard({
  isActive,
  onClick,
  className = "",
}: {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`
        ${className}
        flex flex-col items-center justify-center
        gap-2
        px-4 py-4
        rounded-[20px]
        border
        transition-all duration-300
        cursor-pointer
        ${isActive ? "bg-[#edf4e9] border-[#92b382] shadow-sm" : "bg-white border-[#E0E0E0]"}
      `}
    >
      <div
        className={`
          w-[60px] h-[60px] rounded-full flex items-center justify-center
          ${isActive ? "bg-[#92b382] text-white" : "bg-gray-200 text-gray-500"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <span
        className={`text-sm font-bold text-center ${isActive ? "text-black" : "text-gray-400"}`}
      >
        {t("anySpecialist")}
      </span>
    </div>
  );
}

export interface Member {
  id: string;
  name: string;
  rating: string;
  reviews: string;
  img: string;
  active: boolean;
}

interface TeamMembersProps {
  members: Member[];
  className?: string;
  cardClassName?: string;
  containerClassName?: string;
  providerId?: string;
}

const TeamMembers: React.FC<TeamMembersProps> = ({
  members,
  className = "",
  cardClassName = "",
  containerClassName = "flex-wrap",
  providerId,
}) => {
  const { setSelectedEmployeeID } = useBookingStore();
  const [activeId, setActiveId] = useState<string | undefined>(
    members.find((m) => m.active)?.id
  );

  const { goToBookingSlot } = useNavigationFlow();

  const handleClick = (memberId: string) => {
    setActiveId(memberId);
    setSelectedEmployeeID(memberId);
    goToBookingSlot(providerId ?? "");
  };


  return (
    <div
      className={`
        ${className} 
        p-6
        bg-white
        rounded-[20px]
        shadow-[0px_8px_32px_0px_#00000014]
        flex justify-center
      `}
    >
      <div className={`flex ${containerClassName} justify-center gap-4`}>
        <AnyEmployeeCard
          isActive={activeId === ANY_EMPLOYEE_ID}
          onClick={() => handleClick(ANY_EMPLOYEE_ID)}
          className={cardClassName}
        />
        {members.map((member) => (
          <EmployeeCard
            key={member.id}
            name={member.name}
            rating={member.rating}
            reviewsCount={member.reviews}
            imageUrl={member.img}
            isActive={member.id === activeId}
            onClick={() => handleClick(member.id)}
            className={cardClassName}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;
