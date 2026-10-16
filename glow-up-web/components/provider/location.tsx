"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, Loader2, MapPin, Navigation, Search } from "lucide-react";
import { useProviderStore } from "@/store/providerStore";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full rounded-xl bg-gray-100 animate-pulse" />
  ),
});

export default function LocationManager({ isEditing = false }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();
  const { address, setAddress, coordinates, setCoordinates } =
    useProviderStore();

  const [pickedFromGPS, setPickedFromGPS] = useState(coordinates !== null);
  const [submitted, setSubmitted] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [addressApiError, setAddressApiError] = useState("");

  useEffect(() => {
    if (coordinates === null && navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
          setPickedFromGPS(true);
          setIsLoadingLocation(false);
        },
        () => setIsLoadingLocation(false),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, [coordinates, setCoordinates]);

  const canGoNext = useMemo(() => {
    return address.trim().length > 0;
  }, [address]);

  const handlePlaceSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setPickedFromGPS(true);
        setSearchError("");
      } else {
        setSearchError(t("provider.providerLocation.placeNotFound"));
      }
    } catch {
      setSearchError(t("provider.providerLocation.searchError"));
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t("provider.providerLocation.locationNotSupported"));
      return;
    }

    setIsLoadingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setPickedFromGPS(true);
        setLocationError("");
        setIsLoadingLocation(false);
      },
      () => {
        setLocationError(t("provider.providerLocation.locationDenied"));
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleNext = async () => {
    setSubmitted(true);
    setAddressApiError("");

    if (!canGoNext) return;

    try {
      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) {
        console.error("providerId not found");
        return;
      }

      await patch(
        `/providers/${providerId}`,
        {
          address,
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      nav.goToProviderWorkingHours();
    } catch (e: any) {
      const errorCode = e?.response?.data?.errorCode || e?.data?.errorCode;

      const backendMessage =
        e?.response?.data?.message || e?.data?.message || e?.message;

      if (errorCode === "SERVICE_PROVIDER_ADDRESS_INVALID") {
        setAddressApiError(backendMessage || "العنوان غير صالح");
      } else {
        setAddressApiError(backendMessage || "حدث خطأ أثناء حفظ العنوان");
      }

      console.error("Failed to save location", e);
      console.log("ERROR FULL:", e);
      console.log("ERROR RESPONSE:", e?.response?.data || e?.data);
    }
  };

  return (
    <div className="w-full">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">
          <span>
            {t("provider.providerLocation.addressLabel")}
            <span className="text-red-500">*</span>
          </span>
        </label>

        <div className="relative">
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressApiError("");
              if (e.target.value.trim()) setPickedFromGPS(false);
            }}
            placeholder={t("provider.providerLocation.addressPlaceholder")}
            className={[
              "h-12 w-full rounded-xl border px-4 text-sm outline-none transition",
              submitted && !canGoNext
                ? "border-red-500 focus:ring-red-100"
                : addressApiError
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

        {submitted && !canGoNext && (
          <p
            className={[
              "mt-2 text-xs text-red-500",
              isRTL ? "text-right" : "text-left",
            ].join(" ")}
          >
            {t("provider.providerLocation.addressRequired")}
          </p>
        )}

        {addressApiError && (
          <p
            className={[
              "mt-2 text-xs text-red-500",
              isRTL ? "text-right" : "text-left",
            ].join(" ")}
          >
            {addressApiError}
          </p>
        )}

        {locationError && (
          <p
            className={[
              "mt-2 text-xs text-red-500",
              isRTL ? "text-right" : "text-left",
            ].join(" ")}
          >
            {locationError}
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
          disabled={isLoadingLocation}
          className={[
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200",
            "text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors",
            isRTL ? "flex-row-reverse" : "flex-row",
            isLoadingLocation ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {isLoadingLocation
            ? t("provider.providerLocation.detectingLocation")
            : t("provider.providerLocation.pickMyLocation")}
          {isLoadingLocation ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
          ) : (
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
          )}
        </button>

        {coordinates && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
              <Navigation className="h-4 w-4 text-green-600" />
              <div className="text-sm">
                <span className="font-medium text-green-700">
                  {t("provider.providerLocation.coordinatesDetected")}
                </span>
                <p className="mt-0.5 text-xs text-green-600">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlaceSearch()}
                placeholder={t("provider.providerLocation.searchPlaceholder")}
                className={[
                  "h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition",
                  "focus:border-gray-300 focus:ring-gray-100",
                  isRTL ? "pl-12 pr-4 text-right" : "pl-4 pr-12 text-left",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={handlePlaceSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={[
                  "absolute top-1/2 -translate-y-1/2 rounded-lg p-2 transition-colors",
                  "hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
                  isRTL ? "left-2" : "right-2",
                ].join(" ")}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : (
                  <Search className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>

            {searchError && (
              <p
                className={[
                  "text-xs text-red-500",
                  isRTL ? "text-right" : "text-left",
                ].join(" ")}
              >
                {searchError}
              </p>
            )}

            <LocationMap
              lat={coordinates.lat}
              lng={coordinates.lng}
              className="border border-gray-200"
              onLocationChange={(lat, lng) => setCoordinates({ lat, lng })}
            />
          </div>
        )}

        {!isEditing && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className={[
                "w-full rounded-xl py-3 font-semibold transition",
                canGoNext
                  ? "bg-[#79A66B] text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400",
              ].join(" ")}
            >
              {t("admin-dashboard.serviceNext")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
