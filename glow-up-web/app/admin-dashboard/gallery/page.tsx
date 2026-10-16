"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ImageUploaderManager from "../../../components/provider/imageUploaderManager";
import ImageUploaderManagerCover from "../../../components/provider/ImageUploaderManagerCover";
import PrimaryButton from "@/components/shared/PrimaryButton";
import { ServiceProvider } from "../../../integration/services/provider/providerService";
import { filesService } from "../../../integration/services/files/files.service";
import { useProviderStore } from "@/store/providerStore";
import { ImageIcon, Images, Loader2, Save, AlertCircle, Layout } from "lucide-react";
// 
export default function UpdateImagesDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [activeTab, setActiveTab] = useState<"cover" | "gallery">("cover");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cover, setCover] = useState<any>(null);

  const { images, setImages, removeImage: removeImageFromStore } = useProviderStore() as any;
  const BASE_FILE_URL = "https://api-staging.theglowhub.com.sa/files/public?path=";

  const hasNewGallery = images.some((img: any) => img.file instanceof File);
  const hasNewCover = cover?.file instanceof File;
  const hasChanges = hasNewGallery || hasNewCover;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const p = await ServiceProvider.getMe();
        if (!alive) return;
        setProvider(p);

        if (p?.gallery) {
          const formattedImages = p.gallery.map((path: string) => ({
            id: crypto.randomUUID(),
            previewUrl: path.startsWith("http") ? path : `${BASE_FILE_URL}${path}`,
            blobPath: path,
          }));
          setImages(formattedImages);
        }

        if (p?.coverImage) {
          setCover({
            id: crypto.randomUUID(),
            previewUrl: p.coverImage.startsWith("http") ? p.coverImage : `${BASE_FILE_URL}${p.coverImage}`,
            blobPath: p.coverImage,
          });
        }
      } catch (e) {
        console.error("❌ Failed to load provider data", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [setImages]);

  const handleDeleteImage = async (imageToDelete: any) => {
    const providerId = provider?._id;
    if (imageToDelete.blobPath && providerId) {
      try {
        await filesService.deleteProviderImage(providerId, imageToDelete.blobPath);
      } catch (err) {
        console.error("Delete failed", err);
        return;
      }
    }
    if (imageToDelete.file) URL.revokeObjectURL(imageToDelete.previewUrl);
    removeImageFromStore(imageToDelete.id);
  };

  const handleSaveChanges = async () => {
    const providerId = provider?.id;
    if (!providerId) return;

    try {
      setErrorMessage(null);
      setIsSaving(true);

      if (hasNewGallery) {
        const newFiles = images
          .filter((img: any) => img.file instanceof File)
          .map((img: any) => img.file);

        for (const file of newFiles) {
          await filesService.uploadProviderGallery(providerId, file);
        }
      }

      if (hasNewCover) {
        await filesService.uploadProviderCover(providerId, cover.file);
      }

      window.location.reload();
    } catch (err: any) {

      const backendMessage =
        err?.response?.data?.message || 
        err?.response?.data?.errorCode ||
        err?.message ||
        "Unknown error";

      setErrorMessage(
        isRTL ? `${backendMessage}` : ` ${backendMessage}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="text-[#7BAE6A] animate-spin mb-4" size={48} />
        <p className="text-gray-500 font-medium">{t("loadingMessage")}</p>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#7BAE6A]/10 rounded-xl text-[#7BAE6A]">
            <Layout size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{t("admin-dashboard.salonImages")}</h2>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl w-full">
          <button
            type="button"
            onClick={() => setActiveTab("cover")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "cover"
              ? "bg-white text-[#7BAE6A] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <ImageIcon size={18} />
            {t("coverImage")}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "gallery"
              ? "bg-white text-[#7BAE6A] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Images size={18} />
            {t("gallery")}
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
          {activeTab === "cover" ? (
            <div key="cover-section">
              <ImageUploaderManagerCover
                cover={cover}
                setCover={setCover}
                isLoading={isSaving}
              />
            </div>
          ) : (
            <div key="gallery-section">
              <ImageUploaderManager
                isCreateMode={false}
                isLoading={isSaving}
                onDelete={handleDeleteImage}
              />
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center">
            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg text-sm w-full max-w-md">
                <AlertCircle size={16} />
                <span className="flex-1 text-center">{errorMessage}</span>
              </div>
            )}

            <PrimaryButton
              className={`px-8 h-11 w-fit min-w-[180px] rounded-xl text-sm font-bold transition-all flex items-center justify-center ${hasChanges
                ? "bg-[#7BAE6A] hover:bg-[#6b945d] shadow-md shadow-green-100 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
              onClick={handleSaveChanges}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2 w-full">
                  <Loader2 className="animate-spin" size={18} />
                  <span>{t("admin-dashboard.saving")}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full">
                  <Save size={18} />
                  <span>{t("admin-dashboard.saveChanges")}</span>
                </div>
              )}
            </PrimaryButton>

            {hasChanges && (
              <p className="text-center text-amber-600 text-[10px] font-bold mt-3 animate-pulse uppercase tracking-wider">
                {isRTL ? "تغييرات غير محفوظة" : "Unsaved Changes"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}