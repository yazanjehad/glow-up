"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, MapPin } from "lucide-react";

// تصدير الـ Interface لاستخدامه في أماكن أخرى إذا لزم الأمر
export interface LocationPickerProps {
  address: string;
  setAddress: (val: string) => void;
  onCoordinatesPick: (coords: { lat: number; lng: number }) => void;
  onNext: () => void;
  onSkip: () => void;
  initialPickedFromGPS?: boolean;
}

export default function LocationPicker({
  address,
  setAddress,
  onCoordinatesPick,
  onNext,
  onSkip,
  initialPickedFromGPS = false,
}: LocationPickerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [pickedFromGPS, setPickedFromGPS] = useState(initialPickedFromGPS);
  const [submitted, setSubmitted] = useState(false);
  const [locationError, setLocationError] = useState("");

  const canGoNext = useMemo(() => {
    return address.trim().length > 0 || pickedFromGPS;
  }, [address, pickedFromGPS]);

  const handlePickMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t("provider.providerLocation.locationNotSupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onCoordinatesPick({ lat: latitude, lng: longitude });
        setPickedFromGPS(true);
        setLocationError("");
      },
      () => setLocationError(t("provider.providerLocation.locationDenied")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleNextInternal = () => {
    setSubmitted(true);
    if (canGoNext) onNext();
  };

  return (
    <div className="w-full">
      <div className="rounded-[20px] bg-white p-6 shadow-sm">
        <h1 className="text-center text-xl font-bold text-gray-900">
          {t("provider.providerLocation.title")}
        </h1>

        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
          {t("provider.providerLocation.subtitle")}
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            <span>{t("provider.providerLocation.addressLabel")}</span>
            <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (e.target.value.trim()) setPickedFromGPS(false);
              }}
              placeholder={t("provider.providerLocation.addressPlaceholder")}
              className={[
                "h-12 w-full rounded-xl border px-4 text-sm outline-none",
                submitted && !canGoNext
                  ? "border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-gray-300 focus:ring-gray-100",
                isRTL ? "text-right" : "text-left",
              ].join(" ")}
            />

            <Info
              className={[
                "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300",
                isRTL ? "left-4" : "right-4",
              ].join(" ")}
            />
          </div>

          {((submitted && !canGoNext) || locationError) && (
            <p
              className={[
                "mt-2 text-xs text-red-500",
                isRTL ? "text-right" : "text-left",
              ].join(" ")}
            >
              {locationError || t("provider.providerLocation.addressRequired")}
            </p>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-400">
              {t("provider.providerLocation.or")}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handlePickMyLocation}
            className={[
              "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200",
              "text-sm font-medium text-gray-900 hover:bg-gray-50",
              isRTL ? "flex-row-reverse" : "flex-row",
            ].join(" ")}
          >
            {t("provider.providerLocation.pickMyLocation")}
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
          </button>

          <button
            type="button"
            onClick={handleNextInternal}
            className="mt-6 h-12 w-full rounded-xl bg-[#79A66B] text-sm font-semibold text-white"
          >
            {t("provider.common.next")}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="mt-4 w-full py-3 text-sm font-semibold text-gray-900"
          >
            {t("provider.common.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
