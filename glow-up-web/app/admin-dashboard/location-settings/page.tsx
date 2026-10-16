"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, Save, CheckCircle2 } from "lucide-react";
import { IoMdHome } from "react-icons/io";
import { IoStorefrontOutline } from "react-icons/io5";

import { useProviderStore } from "@/store/providerStore";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

type ServiceLocation = "home" | "salon" | "both";

const SalonServiceManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const setServiceLocation = useProviderStore(
    (s: any) => s.setServiceLocation,
  ) as (v: ServiceLocation) => void;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [currentMode, setCurrentMode] = useState<ServiceLocation>("home");
  const [tempMode, setTempMode] = useState<ServiceLocation>("home");

  const [pickHome, setPickHome] = useState(false);
  const [pickSalon, setPickSalon] = useState(false);

  const computeMode = (homeOn: boolean, salonOn: boolean): ServiceLocation => {
    if (homeOn && salonOn) return "both";
    if (salonOn) return "salon";
    return "home";
  };

  useEffect(() => {
    setTempMode(computeMode(pickHome, pickSalon));
  }, [pickHome, pickSalon]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const provider = await ServiceProvider.getMe();
        const mode = (provider?.serviceLocation || "home") as ServiceLocation;

        if (!alive) return;

        setCurrentMode(mode);
        setTempMode(mode);
        setServiceLocation(mode);

        setPickHome(mode === "home" || mode === "both");
        setPickSalon(mode === "salon" || mode === "both");
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.response?.data?.message ||
          "Failed to load service mode";
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [setServiceLocation]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (tempMode === currentMode) {
        setIsEditing(false);
        return;
      }

      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) throw new Error("Missing providerId");

      const res = await patch(
        `/providers/${providerId}`,
        { serviceLocation: tempMode },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      const updated = res.data as {
        serviceLocation?: ServiceLocation;
      };

      const saved = updated?.serviceLocation || tempMode;

      setCurrentMode(saved);
      setTempMode(saved);
      setServiceLocation(saved);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempMode(currentMode);
    setPickHome(currentMode === "home" || currentMode === "both");
    setPickSalon(currentMode === "salon" || currentMode === "both");
    setIsEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="p-6 text-center">{t("loading") || "Loading..."}</div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold">
          {t("admin-dashboard.serviceModeManagement")}
        </h2>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
        >
          {isEditing ? (
            <Save className="w-4 h-4" />
          ) : (
            <Edit2 className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl border">
        {!isEditing ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                {currentMode === "home" ? (
                  <IoMdHome className="w-12 h-12 text-[#79A66B]" />
                ) : currentMode === "salon" ? (
                  <IoStorefrontOutline className="w-12 h-12 text-[#79A66B]" />
                ) : (
                  <div className="flex items-center gap-2">
                    <IoMdHome className="w-10 h-10 text-[#79A66B]" />
                    <IoStorefrontOutline className="w-10 h-10 text-[#79A66B]" />
                  </div>
                )}
              </div>

              <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                <CheckCircle2 className="w-6 h-6 text-[#79A66B]" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {currentMode === "both"
                ? t("fromBoth")
                : currentMode === "salon"
                  ? t("fromStore")
                  : t("fromHome")}
            </h3>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setPickHome((v) => !v)}
                className={`flex-1 p-6 rounded-2xl border transition ${pickHome
                    ? "border-[#79A66B] bg-[#79A66B]/5"
                    : "border-gray-200"
                  }`}
              >
                <IoMdHome className="w-10 h-10 mx-auto text-[#79A66B]" />
                <p className="mt-2 font-bold">{t("fromHome")}</p>
              </button>

              <button
                onClick={() => setPickSalon((v) => !v)}
                className={`flex-1 p-6 rounded-2xl border transition ${pickSalon
                    ? "border-[#79A66B] bg-[#79A66B]/5"
                    : "border-gray-200"
                  }`}
              >
                <IoStorefrontOutline className="w-10 h-10 mx-auto text-[#79A66B]" />
                <p className="mt-2 font-bold">{t("fromStore")}</p>
              </button>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || tempMode === currentMode}
              className="w-full py-3 bg-[#79A66B] text-white rounded-xl"
            >
              {saving ? t("admin-dashboard.saving") : t("admin-dashboard.saveChanges")}
            </button>

            <button
              onClick={handleCancel}
              className="w-full py-3 mt-3 border rounded-xl"
            >
              {t("cancel")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SalonServiceManagement;
