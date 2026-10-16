"use client";
import  Footer from "@/components/shared/Footer"
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { SearchBar } from "@/components/search/SearchBar";
import { HeroSection } from "@/components/hero/Hero";
import { SearchValues } from "@/app/models/SearchValues";
import { HeroData } from "../models/HeroData";
import SalonsGrid from "@/components/salons/SalonsGrid";
import SalonsFilters from "@/components/salons/SalonsFilters"; 
import { WhyChooseUs } from "@/components/shared/WhyChooseUs";
import { useCallback, useEffect, useRef, useState } from "react";
import { SalonUi } from "@/integration/services/provider/provider.types";
import { mapApiToSalon } from "@/integration/services/provider/provider.types";
import type { SalonApiDto } from "@/integration/services/provider/provider.types";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { ReportService } from "@/integration/services/report/report.service";
import { MapPin, SearchX } from "lucide-react";

function mapHomeItems(items: SalonApiDto[]): SalonUi[] {
  return items.map((item) => mapApiToSalon(normalizeHomeItem(item)));
}

function normalizeHomeItem(item: SalonApiDto & { type?: { id?: string; _id?: string; code?: string; name?: { en?: string; ar?: string } } }): SalonApiDto {
  if (!item.type || typeof item.type !== "object") return item;
  const t = item.type as { id?: string; _id?: string; code?: string; name?: { en?: string; ar?: string } };
  if (t.id && !t._id) return { ...item, type: { ...t, _id: t.id } } as SalonApiDto;
  return item as SalonApiDto;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const lastCoordsRef = useRef<{ lat?: number; lng?: number }>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const locationAutoRequested = useRef(false);

  const [searchResults, setSearchResults] = useState<SalonUi[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [homeData, setHomeData] = useState<{
    newest: SalonUi[];
    topRated: SalonUi[];
    nearest: SalonUi[];
    anonymousList: SalonUi[];
  }>({ newest: [], topRated: [], nearest: [], anonymousList: [] });

  const [heroData, setHeroData] = useState<HeroData>({
    numberOfNewClients: 0,
    numberOfSalons: 0,
    numberOfBookings: 0,
  });

  const fetchHome = useCallback(async (latitude?: number, longitude?: number) => {
    lastCoordsRef.current = { lat: latitude, lng: longitude };
    try {
      const res = await ServiceProvider.getHome(latitude, longitude);
      setHomeData({
        newest: mapHomeItems(res.newest ?? []),
        topRated: mapHomeItems(res.topRated ?? []),
        nearest: mapHomeItems(res.nearest ?? []),
        anonymousList: mapHomeItems(res.anonymousList ?? []),
      });
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  }, []);

  const handleSearch = async (values: SearchValues) => {
    setSearchError(null);
    setHasSearched(false); 

    if (
      (!values.name || values.name.trim() === "") &&
      (!values.providerType || values.providerType === "") &&
      (!values.serviceCategory || values.serviceCategory === "") &&
      (!values.sortBy || values.sortBy === "")
    ) {
      setSearchError("filterMessage.enter_search_query");
      setHasSearched(true); 
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      // If sorting by nearest, try to get coordinates
      if (values.sortBy === "nearest") {
        const getCoords = () => new Promise<{ lat: number; lng: number } | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 }
          );
        });
        const coords = await getCoords();
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const response = await ServiceProvider.getToFilter({
        name: values.name,
        type: values.providerType,
        serviceCategory: values.serviceCategory,
        sortBy: values.sortBy,
        latitude: values.sortBy === "nearest" ? latitude : undefined,
        longitude: values.sortBy === "nearest" ? longitude : undefined,
      });

      const mappedResults = mapHomeItems(response.data);

      // Client-side sorting fallback
      let finalResults = [...mappedResults];
      if (values.sortBy === "topRated") {
        finalResults.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          // If ratings are equal, sort by number of reviews
          return (b.reviews || 0) - (a.reviews || 0);
        });
      } else if (values.sortBy === "newest") {
        // Use ID comparison as a fallback for newest
        finalResults.sort((a, b) => b.id.localeCompare(a.id));
      }

      setSearchResults(finalResults);
    } catch (error) {
      console.error("❌ فشلت عملية البحث:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  useEffect(() => {
    fetchHome();
    const loadHeroData = async () => {
      try {
        const stats = await ReportService.getSiteStats();
        setHeroData(stats);
      } catch { /* ignore */ }
    };
    loadHeroData();
  }, [fetchHome]);

  const didInitLangRef = useRef(false);
  useEffect(() => {
    // The salon name/description are localized at fetch time (Accept-Language
    // header + mapApiToSalon). Re-fetch so they reflect the new language
    // without requiring a manual page refresh. Skip the initial run since the
    // mount effect already performs the first fetch.
    if (!didInitLangRef.current) {
      didInitLangRef.current = true;
      return;
    }
    const { lat, lng } = lastCoordsRef.current;
    fetchHome(lat, lng);
  }, [i18n.language, fetchHome]);

  useEffect(() => {
    if (loading || homeData.nearest.length > 0 || locationAutoRequested.current) return;
    if (!navigator.geolocation) return;

    locationAutoRequested.current = true;
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchHome(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLocationError("home.locationDenied");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [loading, homeData.nearest.length, fetchHome, t]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchHome(pos.coords.latitude, pos.coords.longitude),
      () => setLocationLoading(false),
      { enableHighAccuracy: true }
    );
  }, [fetchHome]);

  return (
    <Layout>
      <section className="bg-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <HeroSection data={heroData} />
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {isSearching ? (
        <div className="py-10 text-center text-[#79A66B] font-medium">
          {t("filterMessage.searching", { defaultValue: "Searching..." })}
        </div>
      ) : hasSearched && (
        <div className="mb-8">
          {searchResults.length > 0 && !searchError ? (
            <SalonsFilters 
              salons={searchResults} 
              title={t("filterMessage.search_results", { defaultValue: "Search Results" })} 
              onClear={clearSearch}
            />
          ) : (
            <div className="max-w-[80%] mx-auto px-4 py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <SearchX className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchError ? t(searchError, { defaultValue: "الرجاء إدخال نص أو اختيار خدمة للبحث" }) 
                             : t("filterMessage.no_results_found", { defaultValue: "No results found" })}
              </h3>
              
              {!searchError && (
                <p className="text-gray-500 mb-6 text-center">
                  {t("filterMessage.try_adjusting_filters", { defaultValue: "Try adjusting your search or filters to find what you're looking for." })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <section className="py-4">
        {homeData.nearest.length > 0 ? (
          <SalonsGrid salons={homeData.nearest} title={t("nearest")} />
        ) : (
          <div className="max-w-[85%] mx-auto px-4">
            <div className="w-full flex mb-6">
              <h2 className="font-bold text-2xl text-gray-900 border-[#7BAE6A] border-l-4 pl-3 rtl:border-l-0 rtl:border-r-4 rtl:pr-3 uppercase">
                {t("nearest")}
              </h2>
            </div>
            <div className="rounded-2xl bg-gray-50 border p-12 flex flex-col items-center gap-4 text-center">
              <p className="text-gray-600 text-sm max-w-sm">
                {locationError ? t(locationError) : t("home.enableLocationToSeeNearest")}
              </p>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#79A66B] px-6 py-2.5 text-white disabled:opacity-50 shadow-sm hover:shadow-md transition-all font-medium"
              >
                <MapPin className="w-4 h-4" />
                {locationLoading ? t("loading") : t("home.useMyLocation")}
              </button>
            </div>
          </div>
        )}
      </section>

      {!loading && (
        <>
          <SalonsGrid salons={homeData.topRated} title={t("topRated")} />
          <SalonsGrid salons={homeData.newest} title={t("home.newest")} />
        </>
      )}

      <WhyChooseUs />
      <Footer/>
    </Layout>
  );
}