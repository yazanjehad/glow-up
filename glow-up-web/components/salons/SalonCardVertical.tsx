"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { looksLikeDbId } from "@/integration/services/provider/provider.types";

interface Salon {
  id: string;
  name: string;
  description?: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  price?: number;
  location: string;
}

interface SalonCardVerticalProps {
  salon: Salon;
}

const SalonCardVertical = ({ salon }: SalonCardVerticalProps) => {
  return (
    <Link href={`/salon/${salon.id}`}>
      <div className="flex flex-col bg-white border border-gray-200 rounded-[16px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
        {/* Image */}
        <div className={`relative w-full h-[100px] overflow-hidden flex-shrink-0 flex items-center justify-center ${
          !salon.image || salon.image === "/No image available.png" ? "bg-[#fcfcfc] border-b border-gray-50" : "bg-gray-100"
        }`}>
          <Image
            src={salon.image || "/No image available.png"}
            alt={salon.name}
            fill
            className={
              !salon.image || salon.image === "/No image available.png"
                ? "object-contain p-4 opacity-40"
                : "object-cover"
            }
            sizes="280px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.indexOf("/No image available.png") === -1) {
                target.src = "/No image available.png";
                target.className = "object-contain p-4 opacity-40";
                if (target.parentElement) {
                  target.parentElement.className = "relative w-full h-[100px] overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#fcfcfc] border-b border-gray-100";
                }
              }
            }}
          />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2">
          {/* Name */}
          <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">
            {salon.name}
          </h4>

          {/* Description */}
          {salon.description && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {salon.description}
            </p>
          )}

          {/* Divider */}
          <div className="w-full border-t border-gray-100"></div>

          {/* Rating & Category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold">{salon.rating}</span>
              <span className="text-xs text-blue-500">({salon.reviews})</span>
            </div>
            {!looksLikeDbId(salon.category) && salon.category && (
              <div className="bg-[#e0f2fe] px-2 py-1 rounded-lg">
                <span className="text-xs font-medium text-[#0ea5e9]">
                  {salon.category}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} className="text-gray-400" />
            <span className="line-clamp-1">{salon.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SalonCardVertical;
