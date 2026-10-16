"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { X, Loader2, UploadCloud } from "lucide-react";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";
import { filesService } from "@/../../integration/services/files/files.service";

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const mb = (b: number) => b / (1024 * 1024);

interface Props {
  isCreateMode?: boolean;
  initialUrls?: string[];
  onNext?: () => Promise<void>;
  onDelete?: (image: any) => Promise<void>;
  isLoading?: boolean;
}

export default function ImageUploaderManager({
  isCreateMode = false,
  initialUrls = [],
  onNext,
  onDelete,
  isLoading = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();

  const {
    images,
    addImage,
    removeImage: removeImageFromStore,
    setImages,
  } = useProviderStore() as any;

  const providerId = useProviderStore((state) => state.providerId);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const BASE_FILE_URL = "https://api-staging.theglowhub.com.sa/files/public?path=";

  useEffect(() => {
    if (!initialUrls?.length || images?.length) return;

    const clean = initialUrls
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .slice(0, MAX_FILES);

    if (!clean.length) return;

    setImages(
      clean.map((url) => ({
        id: crypto.randomUUID(),
        previewUrl: url.startsWith("http") ? url : `${BASE_FILE_URL}${url}`,
        blobPath: url.replace(BASE_FILE_URL, ""),
      }))
    );
  }, [initialUrls, images?.length, setImages]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) return;

    for (const f of files.slice(0, remaining)) {
      if (!ACCEPT_MIME.includes(f.type as any) || mb(f.size) > MAX_SIZE_MB) continue;

      addImage({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }
  };

  const remove = async (id: string) => {
    const img = images.find((x: any) => x.id === id);
    if (!img) return;

    let blobPath = img.blobPath;
    if (blobPath?.startsWith("http")) {
      try {
        const url = new URL(blobPath);
        blobPath = decodeURIComponent(url.searchParams.get("path") || "");
      } catch {
        blobPath = img.blobPath;
      }
    }

    if (onDelete) {
      await onDelete({ ...img, blobPath });
    } else {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
      if (blobPath) await filesService.deleteProviderImage(providerId, blobPath);
      removeImageFromStore(id);
    }
  };

  const canNext = images.length > 0;
  const canAdd = images.length < MAX_FILES;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="w-full max-w-4xl mx-auto px-4 py-6 transition-all duration-500"
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT_MIME.join(",")}
        onChange={onPick}
        className="hidden"
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="w-2 h-8 bg-[#7BAE6A] rounded-full inline-block" />
            {t("gallery")}
          </h2>
          <p className="text-gray-500 text-sm mt-1 px-5">
            {t("uploadYourFirstImageToStartYourGallery")}
          </p>
        </div>
        
        <div className={`self-start sm:self-center px-4 py-2 rounded-2xl border transition-all duration-300 flex items-center gap-2 ${
          canAdd ? "bg-white border-gray-100 shadow-sm" : "bg-amber-50 border-amber-100 text-amber-700"
        }`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${canAdd ? "bg-green-500" : "bg-amber-500"}`} />
          <span className="font-bold text-sm tabular-nums">
            {images.length} / {MAX_FILES}
          </span>
          <span className="text-xs text-gray-400 font-medium">{t("images")}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Upload Button - Positioned first if gallery is empty, or integrated in grid */}
        {canAdd && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isLoading}
            className="group relative aspect-[4/3] rounded-[32px] border-2 border-dashed border-gray-200 
            bg-gray-50/50 hover:bg-white hover:border-[#7BAE6A] hover:shadow-2xl hover:shadow-green-100 
            transition-all duration-500 flex flex-col items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 group-hover:opacity-0 transition-opacity" />
            <div className="relative p-4 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 group-hover:bg-[#7BAE6A] group-hover:text-white transition-all duration-300">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="relative text-center">
              <span className="block text-sm font-bold text-gray-700 group-hover:text-[#7BAE6A] transition-colors">
                {t("provider.uploadImages.uploadBtn")}
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {MAX_SIZE_MB}MB {t("max")}
              </span>
            </div>
          </button>
        )}

        {/* Gallery Images */}
        {images.map((img: any) => (
          <div
            key={img.id}
            className="group relative aspect-[4/3] rounded-[32px] overflow-hidden bg-gray-100 
            shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          >
            <Image
              src={img.previewUrl}
              alt="Gallery Item"
              fill
              className="object-cover transition-transform duration-[2000ms] group-hover:scale-115"
              unoptimized
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Delete Button */}
            <button
              type="button"
              onClick={() => remove(img.id)}
              disabled={isLoading}
              className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center
              rounded-2xl backdrop-blur-md bg-white/90 text-red-500 shadow-xl
              hover:bg-red-500 hover:text-white transform scale-90 group-hover:scale-100
              transition-all duration-300 active:scale-90 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Empty State Overlay (only if 0 images) */}
      {images.length === 0 && (
        <div className="mt-4 text-center py-10 opacity-60">
           <p className="text-sm text-gray-400">{t("noImageUplodedYet")}</p>
        </div>
      )}

      {/* Footer Actions */}
      {isCreateMode && (
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={nav.goToProviderTeam}
            disabled={isLoading}
            className="order-2 sm:order-1 h-14 px-10 w-full sm:w-auto rounded-2xl border-2 border-gray-100 
            bg-white text-base font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 
            hover:border-gray-200 transition-all disabled:opacity-50"
          >
            {t("provider.common.skip")}
          </button>

          <button
            type="button"
            disabled={!canNext || isLoading}
            onClick={onNext}
            className={`order-1 sm:order-2 flex flex-1 items-center justify-center h-14 w-full rounded-2xl 
              text-base font-bold text-white shadow-xl transition-all transform active:scale-[0.98]
              ${
                canNext && !isLoading
                  ? "bg-[#7BAE6A] hover:bg-[#6b945d] shadow-green-200"
                  : "bg-gray-200 cursor-not-allowed shadow-none"
              }`}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                {t("provider.common.next")}
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}