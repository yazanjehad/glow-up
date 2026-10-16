"use client";

import Image from "next/image";

type Props = {
  title: string;
  description?: string;
  imageSrc?: string;      
  imageAlt?: string;      
};

export default function EmptyState({
  title,
  description,
  imageSrc = "/empty-bookings.png",
  imageAlt = "Empty",
}: Props) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 w-[240px] max-w-full">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={480}
            height={320}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        <div className="text-[16px] font-semibold text-[#111827]">{title}</div>

        {description ? (
          <div className="mt-1 text-[13px] text-black/50">{description}</div>
        ) : null}
      </div>
    </div>
  );
}
