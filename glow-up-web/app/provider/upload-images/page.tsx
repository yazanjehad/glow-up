"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { filesService } from "@/integration/services/files/files.service";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import ImageUploaderManagerCover from "../../../components/provider/ImageUploaderManagerCover";
import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import { useProviderStore } from "@/store/providerStore";

export default function CreateImagesPage() {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const nav = useNavigationFlow();

  const { providerId, coverImage, setCoverImage } = useProviderStore();

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleUploadAndNext = async (): Promise<void> => {
    setErrorMessage("");
    const currentProviderId = providerId || localStorage.getItem("providerId")?.replace(/"/g, "");

    if (!currentProviderId) {
      setErrorMessage(t("provider.providerPackages.providerIdMissing"));
      return;
    }

    // إذا تم حذف الصورة أو لم ترفع أصلاً، ننتقل للخطوة التالية
    if (!coverImage || !coverImage.file) {
      nav.goToProviderDocuments();
      return;
    }

    if (coverImage.file && !coverImage.url) {
      setIsUploading(true);
      try {
        const res = await filesService.uploadProviderCover(currentProviderId, coverImage.file);
        setCoverImage({ ...coverImage, blobPath: res.blobPath, url: res.url });
        nav.goToProviderDocuments();
      } catch (error: any) {
        const msg = error.response?.data?.message || t("provider.providerPackages.saveFailed");
        setErrorMessage(msg);
      } finally {
        setIsUploading(false);
      }
    } else {
      nav.goToProviderDocuments();
    }
  };

  return (
    <div className="max-w-[500px] mx-auto p-4 relative">
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-red-100 animate-in fade-in zoom-in duration-300 max-w-sm w-full text-center">
            <p className="text-gray-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      <HeaderProvider
        titleKey="provider.uploadImages.title"
        subtitleKey="provider.uploadImages.subtitle"
      />
      
      <div className="mt-8">
        <ImageUploaderManagerCover
          cover={coverImage}
          setCover={setCoverImage}
          isLoading={isUploading}
        />

        <div className="flex flex-col gap-3 mt-10">
          <button
            className={`w-full py-4 rounded-2xl font-bold transition-all ${
              isUploading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#7BAE6A] text-white hover:bg-[#6a995a] shadow-lg active:scale-95"
            }`}
            onClick={handleUploadAndNext}
            disabled={isUploading}
          >
            {isUploading ? t("uploading") : t("next")}
          </button>

          {!isUploading && (
            <button
              onClick={() => nav.goToProviderDocuments()}
              className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
            >
              {t("skip")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}