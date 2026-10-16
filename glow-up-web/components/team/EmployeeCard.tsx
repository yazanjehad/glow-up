"use client";

import React, { useState } from "react";
import Image from "next/image";
import { employeesService } from "@/integration/services/admin/employees.service";

interface EmployeeCardProps {
  name: string;
  rating: string;
  reviewsCount: string;
  imageUrl: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  name,
  rating,
  reviewsCount,
  imageUrl,
  isActive,
  onClick,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);
  const showFallback = !imageUrl || imgError;

  return (
    <div
      onClick={onClick}
      className={`
        ${className}
        flex flex-col items-center
        gap-[5px]
        px-8 py-4
        rounded-[20px]
        border
        transition-all duration-300
        cursor-pointer
        ${isActive ? "bg-[#edf4e9] border-[#92b382] shadow-sm" : "bg-white border-[#E0E0E0]"}
      `}
    >
      {/* Image */}
      <div
        className="relative w-[87px] h-[85px] rounded-full overflow-hidden flex items-center justify-center"
      >
        {!showFallback ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className={`object-cover ${isActive ? "" : "grayscale opacity-70"}`}
            onError={() => setImgError(true)}
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
      <h3
        className={`text-sm font-bold text-center leading-tight ${isActive ? "text-black" : "text-gray-400"}`}
      >
        {name}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1 flex-row-reverse">
        <span className={`text-xs ${isActive ? "text-[#3fa9f5]" : "text-gray-300"}`}>
          ({reviewsCount})
        </span>
        <span className={`text-xs font-bold ${isActive ? "text-gray-800" : "text-gray-300"}`}>
          {rating}
        </span>
        <svg
          className={`w-3.5 h-3.5 fill-current ${isActive ? "text-orange-400" : "text-gray-300"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    </div>
  );
};

export default EmployeeCard;
