"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Image as ImageIcon, ExternalLink, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adsService,
  Ad,
  CreateAdPayload,
} from "@/integration/services/admin/ads.service";
import { filesService } from "@/integration/services/files/files.service";
import { NoPermission } from "@/components/auth/NoPermission";
import { hasPermission, PermissionType, isSuperAdmin } from "@/lib/auth/permissions";

const API_BASE_URL = "https://api-staging.theglowhub.com.sa";

function buildPublicImageUrl(path?: string) {
  const clean = (path || "").trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  if (clean.startsWith("/files/public?path=")) return `${API_BASE_URL}${clean}`;
  if (clean.startsWith("files/public?path=")) return `${API_BASE_URL}/${clean}`;
  return `${API_BASE_URL}/files/public?path=${encodeURIComponent(clean)}`;
}

export default function AdsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Permission checks
  const isAdmin = isSuperAdmin();
  const canViewAds = isAdmin || hasPermission([PermissionType.VIEW_ADS]);
  const canAddAds = isAdmin || hasPermission([PermissionType.ADD_ADS]);
  const canAccessPage = canViewAds || canAddAds;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  const loadAds = useCallback(async () => {
    if (!canAccessPage) return;
    try {
      setLoading(true);
      setError("");
      setForbidden(false);
      const response = await adsService.list();
      setAds(response || []);
    } catch (e: any) {
      console.error("Failed to load ads", e);
      const status = e?.response?.status;
      if (status === 403) {
        setForbidden(true);
      } else {
        setError(e?.message || t("ads.errors.loadFailed"));
      }
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [t, canAccessPage]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  if (!canAccessPage) {
    return <NoPermission />;
  }

  const handleAdCreated = () => {
    setShowModal(false);
    loadAds();
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      setError("");
      setSuccess("");
      await adsService.approve(id);
      setSuccess(isRTL ? "تم قبول الإعلان بنجاح" : "Ad approved successfully");
      loadAds();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || (isRTL ? "فشل في قبول الإعلان" : "Failed to approve ad"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      setError("");
      setSuccess("");
      await adsService.reject(id);
      setSuccess(isRTL ? "تم رفض الإعلان بنجاح" : "Ad rejected successfully");
      loadAds();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || (isRTL ? "فشل في رفض الإعلان" : "Failed to reject ad"));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-gray-900">
            {t("ads.title")}
          </h2>
          <p className="text-[13px] text-gray-400 mt-1">
            {t("ads.subtitle")}
          </p>
        </div>
        {canAddAds && (
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#79a66b] hover:bg-[#6a9460] text-white"
          >
            <Plus size={18} />
            {t("ads.addAd")}
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
        {!canViewAds || forbidden ? (
          <NoPermission type="ads" />
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : ads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("ads.noAds")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {ad.image || ad.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={buildPublicImageUrl(ad.image || ad.banner)}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-300" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 ${isRTL ? "left-2" : "right-2"} px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}
                  >
                    {t(`ads.status.${ad.status}`)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {ad.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {ad.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>
                      {new Date(ad.createdAt).toLocaleDateString(
                        isRTL ? "ar-SA" : "en-US"
                      )}
                    </span>
                    {ad.link_to && (
                      <a
                        href={`/salon/${ad.link_to}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#79a66b] hover:underline"
                      >
                        <ExternalLink size={12} />
                        {t("ads.viewProvider")}
                      </a>
                    )}
                  </div>
                  {/* Approve/Reject buttons for pending ads */}
                  {canViewAds && ad.status === "pending" && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(ad._id)}
                        disabled={actionLoading === ad._id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check size={14} className="me-1" />
                        {isRTL ? "قبول" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(ad._id)}
                        disabled={actionLoading === ad._id}
                        className="flex-1 border-red-300 text-red-600 hover:bg-green-50 hover:text-green-600 hover:border-green-600 transition-colors"
                      >
                        <XCircle size={14} className="me-1" />
                        {isRTL ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddAdModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAdCreated}
        />
      )}
    </div>
  );
}

function AddAdModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [form, setForm] = useState<CreateAdPayload>({
    title: "",
    description: "",
    providerId: "",
    banner: "",
    link_to: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const bannerRequiredMessage =
    i18n.language === "ar"
      ? "يرجى رفع صورة البانر"
      : "Please upload the banner image";

  const translateBackendError = (msg: string) => {
    const lower = msg.toLowerCase();
    // Backend sends messages like: "banner should not be empty"
    if (lower.includes("banner") && lower.includes("empty")) {
      return bannerRequiredMessage;
    }
    return msg;
  };

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [bannerPreviewUrl]);

  const handleBannerPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!form.providerId.trim()) {
      setError(t("ads.validation.providerIdRequired"));
      return;
    }

    const localPreview = URL.createObjectURL(file);
    if (bannerPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreviewUrl);
    }
    setBannerPreviewUrl(localPreview);

    try {
      setUploadingBanner(true);
      setError("");
      const uploaded = await filesService.uploadFile({
        file,
        entityType: "AD",
        entityId: form.providerId.trim(),
        fileCategory: "banner",
      });

      setForm((prev) => ({ ...prev, banner: uploaded.blobPath || uploaded.url || "" }));
      if (uploaded.url) {
        setBannerPreviewUrl(buildPublicImageUrl(uploaded.url));
      }
    } catch (err: any) {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
      setBannerPreviewUrl("");
      setForm((prev) => ({ ...prev, banner: "" }));
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (isRTL ? "فشل في رفع صورة البانر" : "Failed to upload banner image"),
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError(t("ads.validation.titleRequired"));
      return;
    }
    if (!form.description.trim()) {
      setError(t("ads.validation.descriptionRequired"));
      return;
    }
    if (!form.providerId.trim()) {
      setError(t("ads.validation.providerIdRequired"));
      return;
    }
    if (!form.banner.trim()) {
      setError(bannerRequiredMessage);
      return;
    }

    if (uploadingBanner) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await adsService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        providerId: form.providerId.trim(),
        banner: form.banner.trim(),
        link_to: form.link_to.trim() || form.providerId.trim(),
      });
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("ads.errors.createFailed");
      if (typeof msg === "string") {
        setError(translateBackendError(msg));
      } else {
        setError(JSON.stringify(msg));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-[20px] w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("ads.modal.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ads.fields.title")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t("ads.placeholders.title")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ads.fields.description")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={t("ads.placeholders.description")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#79a66b] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ads.fields.providerId")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.providerId}
              onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              placeholder={t("ads.placeholders.providerId")}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isRTL ? "صورة" : "Image"}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerPick}
            />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={saving || uploadingBanner}
                className="w-full"
              >
                {uploadingBanner
                  ? isRTL
                    ? "جاري رفع الصورة..."
                    : "Uploading image..."
                  : isRTL
                    ? "تحميل صورة"
                    : "Upload image"}
              </Button>
              <p className="text-xs text-gray-500">
                {isRTL
                  ? "يفضل إدخال معرف المزود أولاً ثم تحميل الصورة."
                  : "Enter provider ID first, then upload image."}
              </p>
              {bannerPreviewUrl && (
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildPublicImageUrl(bannerPreviewUrl)}
                    alt="Banner preview"
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ads.fields.linkTo")}
            </label>
            <Input
              value={form.link_to}
              onChange={(e) => setForm({ ...form, link_to: e.target.value })}
              placeholder={t("ads.placeholders.linkTo")}
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving || uploadingBanner}
              className="flex-1 bg-[#79a66b] hover:bg-[#6a9460] text-white"
            >
              {saving ? t("loading") : t("ads.modal.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
