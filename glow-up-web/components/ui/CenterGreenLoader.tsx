"use client";

type CenterGreenLoaderProps = {
  label?: string;
  fullHeight?: boolean;
};

export default function CenterGreenLoader({
  label,
  fullHeight = true,
}: CenterGreenLoaderProps) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center ${
        fullHeight ? "min-h-[calc(100vh-72px)]" : "min-h-[60vh]"
      }`}
    >
      <div className="h-14 w-14 rounded-full border-4 border-[#79A66B]/30 border-t-[#79A66B] animate-spin" />

      {label && <p className="mt-4 text-sm text-gray-500">{label}</p>}
    </div>
  );
}
