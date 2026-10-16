"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SalonCard from "../../../components/salons/SalonCard";
import { CustomerService } from "@/integration/services/customer/customer.service";
import { SalonUi } from "@/integration/services/provider/provider.types";
import CenterGreenLoader from "@/components/ui/CenterGreenLoader";

export default function FavoritesClient() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [favoriteSalons, setFavoriteSalons] = useState<SalonUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getFavorites = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await CustomerService.getFavorites();
      setFavoriteSalons(res ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load favorites");
      setFavoriteSalons([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    getFavorites();
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      setError("");
      await CustomerService.removeFavorite(id);
      await getFavorites(false);
    } catch (e: any) {
      setError(e?.message || "Failed to remove");
    }
  };

  if (loading) return <CenterGreenLoader label={t("loading")} />;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full px-3 py-6 ${isRTL ? "text-right" : "text-left"}`}
    >
      <h1 className="mb-6 text-base font-medium">{t("header.favorites")}</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {favoriteSalons.length === 0 ? (
        <div className="mt-20 text-center text-sm text-gray-400">
          {t("favoritesPage.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {favoriteSalons.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              showFavorite
              isFavorite={true}
              onToggleFavorite={() => removeFavorite(salon.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
