"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { RefreshCw, Plus, Loader2, X } from "lucide-react";

interface Props {
  cover: any;
  setCover: (cover: any) => void;
  isLoading?: boolean;
}

export default function ImageUploaderManagerCover({
  cover,
  setCover,
  isLoading,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(isRTL ? "حجم الصورة أكبر من 5 ميجابايت" : "Image size exceeds 5MB");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(isRTL ? "حجم الصورة أكبر من 5 ميجابايت" : "Image size exceeds 5MB");
      return;
    }

    if (cover?.previewUrl) URL.revokeObjectURL(cover.previewUrl);

    setCover({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    });

    e.target.value = "";
  };

  const handleChangeCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cover?.previewUrl) URL.revokeObjectURL(cover.previewUrl);
    setCover(null);
    setImageError(false);
  };

  const hasValidImage = cover && !imageError;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="w-full max-w-[85%] lg:max-w-[75%] mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#7BAE6A] rounded-full" />
          <span className="font-bold text-gray-800 text-lg">
            {t("coverImage")}
          </span>
        </div>

        <button
          type="button"
          onClick={handleChangeCover}
          className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100 hover:bg-[#7BAE6A]/10 hover:text-[#7BAE6A] transition-all duration-300"
        >
          <RefreshCw
            size={14}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
          <span className="text-xs font-black uppercase tracking-widest">
            {hasValidImage ? t("change") : t("provider.uploadImages.uploadBtn")}
          </span>
        </button>
      </div>

      <input
        type="file"
        ref={inputRef}
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.heic"
        className="hidden"
        onChange={onFileChange}
        disabled={isLoading}
      />

      {/* Main Preview Container */}
      <div
        onClick={() => !isLoading && !hasValidImage && inputRef.current?.click()}
        className={`relative group w-full aspect-[21/9] rounded-[24px] border-2 border-dashed overflow-hidden transition-all duration-500
    ${hasValidImage
            ? "border-transparent shadow-sm cursor-default"
            : isDragging
              ? "border-[#7BAE6A] bg-[#7BAE6A]/5 scale-[1.01] cursor-copy"
              : "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-[#7BAE6A] hover:shadow-md cursor-pointer"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (cover) return;
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            if (file.size > 5 * 1024 * 1024) {
              alert(isRTL ? "حجم الصورة أكبر من 5 ميجابايت" : "Image size exceeds 5MB");
              return;
            }
            if (cover?.previewUrl) URL.revokeObjectURL(cover.previewUrl);
            setCover({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
          }
        }}
      >
        {hasValidImage ? (
          <>
            <Image
              src={cover.previewUrl}
              alt="Cover"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              unoptimized
              onError={() => setImageError(true)}
            />
            {!isLoading && (
              <button
                onClick={handleRemoveCover}
                className="absolute top-4 right-4 z-20 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-90"
                title={isRTL ? "حذف الصورة" : "Remove image"}
              >
                <X size={20} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                <Plus size={32} />
              </div>
            </div>
            <h4 className="text-base font-bold text-gray-700">
              {imageError
                ? (isRTL ? "لا توجد صورة" : "No image")
                : t("upload")}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              {isRTL ? "اضغط لاختيار صورة" : "Click to select a photo"}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-30">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-[#7BAE6A] animate-spin" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {t("processing")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
