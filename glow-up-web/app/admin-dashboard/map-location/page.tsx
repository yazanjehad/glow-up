"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Edit2 } from "lucide-react";

import { useProviderStore } from "@/store/providerStore";
import LocationManager from "../../../components/provider/location";
import { ServiceProvider } from "../../../integration/services/provider/providerService";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

export default function UpdateLocationPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const address = useProviderStore((s) => s.address);
  const setAddress = useProviderStore((s) => s.setAddress);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalAddress, setOriginalAddress] = useState("");

  useEffect(() => {
    let alive = true;

    const loadLocation = async () => {
      try {
        setLoading(true);

        const provider = await ServiceProvider.getMe();
        const addressFromApi = (provider.address || "").trim();

        if (!alive) return;

        setOriginalAddress(addressFromApi);
        setAddress(addressFromApi);
      } catch (e) {
        console.log("getById error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadLocation();

    return () => {
      alive = false;
    };
  }, [setAddress]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) throw new Error("Missing providerId");

      const newAddress = (address || "").trim();

      if (newAddress === (originalAddress || "").trim()) {
        setIsEditing(false);
        return;
      }

      const res = await patch(
        `/providers/${providerId}`,
        { address: newAddress },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const updated = res.data as { address?: string };
      const savedAddress = (updated.address || newAddress).trim();

      setOriginalAddress(savedAddress);
      setAddress(savedAddress);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save location:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">{t("loading")}</div>;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {t("admin-dashboard.locationManagement")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("admin-dashboard.locationSubtitle")}
        </p>
      </div>

      <div className="rounded-[20px] bg-white p-8 shadow-sm border border-gray-100">
        {!isEditing ? (
          <>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              {t("provider.providerLocation.addressLabel")}
            </label>

            <div className="relative">
              <input
                value={address}
                readOnly
                className={[
                  "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm",
                  "outline-none focus:ring-2 focus:ring-[#79A66B] focus:border-[#79A66B]",
                  isRTL ? "text-right" : "text-left",
                ].join(" ")}
              />
              <MapPin
                className={[
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300",
                  isRTL ? "left-4" : "right-4",
                ].join(" ")}
              />
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <Edit2 className="h-4 w-4" />
              {t("admin-dashboard.changeLocation")}
            </button>
          </>
        ) : (
          <>
            <LocationManager isEditing={true} />

            <button
              onClick={handleSave}
              disabled={saving}
              className={[
                "mt-8 h-12 w-full rounded-xl bg-[#79A66B] font-semibold text-white transition",
                saving ? "opacity-70 cursor-not-allowed" : "hover:bg-[#6b945d]",
              ].join(" ")}
            >
              {saving ? t("admin-dashboard.saving") : t("admin-dashboard.saveChanges")}
            </button>

            <button
              onClick={() => {
                setAddress(originalAddress);
                setIsEditing(false);
              }}
              disabled={saving}
              className="mt-3 h-12 w-full rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              {t("cancel")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}