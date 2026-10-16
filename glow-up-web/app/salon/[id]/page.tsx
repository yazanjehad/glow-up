"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Layout from "@/components/Layout";
import CategoryTabs from "@/components/services/CategoryTabs";
import ServiceCardsList from "@/components/services/ServiceCardsList";
import OrderSummaryCard from "@/components/services/OrderSummaryCard";
import PackageCardsList from "@/components/packages/PackageCardsList";
import OrderSummaryPackagesCard from "@/components/packages/OrderSummaryPackagesCard";
import TeamMemberViewOnly from "@/components/team/TeamMemberViewOnly";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import SalonCard from "@/components/salons/SalonCard";
import SalonDetailsCard from "@/components/booking-details/SalonDetailsCard";
import { SalonUi } from "@/integration/services/provider/provider.types";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { useBookingStore } from "@/store/bookingStore";
import { useServicesStore } from "@/store/serviceStore";
import { usePackagesStore } from "@/store/packageStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";
import { emptyReviewsApiResponse, ReviewUI } from "@/app/models/Review-types";
import { RatingsService } from "@/integration/services/Ratings/ratings.service";
import { CustomerService } from "@/integration/services/customer/customer.service";
import { ProviderPackagesService } from "@/integration/services/provider-packages/provider-packages.service";
import { mapProviderPackagesToUi } from "@/integration/services/provider-packages/provider-packages.types";
import type { ProviderPackageDto } from "@/integration/services/provider-packages/provider-packages.types";
import { getToken } from "@/integration/services/auth/authServices";

export default function SalonDetailsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [salon, setSalon] = useState<SalonUi>();
  const [, setLoading] = useState(true);
  const setSelectedProviderID = useBookingStore((s) => s.setSelectedProviderID);
  const selectedProviderID = useBookingStore((s) => s.selectedProviderID);
  const setProviderServices = useBookingStore((s) => s.setProviderServices);
  const providerServices = useBookingStore((s) => s.providerServices);
  const providerPackages = useBookingStore((s) => s.providerPackages);
  const setProviderPackages = useBookingStore((s) => s.setProviderPackages);
  const selectedServicesIDs = useServicesStore((s) => s.servicesIDS);
  const selectedPackageIDs = usePackagesStore((s) => s.packageIDs);
  const [relatedSalons, setRelatedSalons] = useState<SalonUi[]>([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [lastFetchCount, setLastFetchCount] = useState(0);
  const [reviewsData, setReviewsData] = useState<ReviewUI>(
    emptyReviewsApiResponse(),
  );
  const [isSalonFavorite, setIsSalonFavorite] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "packages">("services");
  const [packageCategory, setPackageCategory] = useState<string>("");
  const RELATED_LIMIT = 4;

  const galleryImages = useMemo(() => {
    const images: string[] = [];

    if (salon?.coverImage) images.push(salon.coverImage);

    if (salon?.gallery && Array.isArray(salon.gallery)) {
      salon.gallery.forEach((img) => {
        if (img && typeof img === "string" && !images.includes(img)) {
          images.push(img);
        }
      });
    }

    return images;
  }, [salon]);

  const fetchReview = async (providerId: string) => {
    let cancelled = false;
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const res = await RatingsService.getPublicReviews(providerId, 1, 5);
      if (!cancelled) setReviewsData(res);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "فشل تحميل المراجعات";
      if (!cancelled) setReviewsError(msg);
    } finally {
      if (!cancelled) setReviewsLoading(false);
    }
  };

  const fetchSalon = async (providerId: string) => {
    try {
      setLoading(true);
      const data = await ServiceProvider.getById(providerId, i18n.language as any);
      setSalon(data);
      const servicesItems = await ServiceProvider.getServicesItems(providerId, i18n.language as any);
      setProviderServices(servicesItems);
      setSelectedProviderID(providerId);

      const rawPackages = (data as { packages?: ProviderPackageDto[] }).packages;
      if (Array.isArray(rawPackages) && rawPackages.length > 0) {
        const uiPackages = mapProviderPackagesToUi(rawPackages).filter(
          (p) => p.isActive !== false
        );
        setProviderPackages(uiPackages);
      } else {
        const packagesUi = await ProviderPackagesService.getByProviderIdAsUi(providerId);
        setProviderPackages(packagesUi);
      }

      const related = await ServiceProvider.getRelated(
        providerId,
        1,
        RELATED_LIMIT,
        i18n.language as any,
      );
      setRelatedSalons(related);
      setLastFetchCount(related.length);
    } catch (error) {
      console.error("fetchSalon error:", error);
    } finally {
      setLoading(false);
    }
  };



  const CheckFavorite = async (id: string) => {
    const res = await CustomerService.isFavorite(id);
    setIsSalonFavorite(res);
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    } else {
      setSelectedProviderID(id);
      useServicesStore.getState().clearServicesIDS();
      useMultiBookingStore.getState().reset();
    }
    fetchSalon(id);
    fetchReview(id);
    if (getToken()) {
      CheckFavorite(id);
    } else {
      setIsSalonFavorite(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, i18n.language]);

  const [activeCategory, setActiveCategory] = useState<string>("exclusive");

  const toggleFavorite = async () => {
    try {
      if (isSalonFavorite) {
        await CustomerService.removeFavorite(selectedProviderID);
        setIsSalonFavorite(false);
      } else {
        await CustomerService.setFavorite(selectedProviderID);
        setIsSalonFavorite(true);
      }
    } catch { }
  };

  const onPay = () => {
    router.push("/booking-for?id=" + selectedProviderID);
  };

  const categories = useMemo(() => {
    const unique = new Set(
      (providerServices ?? []).map((s: any) => String(s?.category ?? s?.categoryLabel ?? "")),
    );
    return Array.from(unique).filter(Boolean);
  }, [providerServices]);

  const packageCategories = useMemo(() => {
    const unique = new Set(
      (providerPackages ?? []).map((p: any) => String(p?.categoires ?? "")),
    );
    return Array.from(unique).filter(Boolean);
  }, [providerPackages]);

  const safePackageCategory = useMemo(() => {
    if (packageCategories.includes(packageCategory)) return packageCategory;
    return packageCategories[0] ?? "";
  }, [packageCategories, packageCategory]);

  const safeActiveCategory = useMemo(() => {
    if (categories.includes(activeCategory)) return activeCategory;
    return categories[0] ?? "";
  }, [categories, activeCategory]);

  const visibleCount = 4;
  const reviews = reviewsData?.reviews ?? [];
  const reviewsCount = reviews.length;

  return (
    <Layout>
      <div dir={isRTL ? "rtl" : "ltr"} className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className=" relative group h-[300px] md:h-[450px] rounded-[2rem] overflow-hidden  mb-10 bg-[#fcfcfc] border border-gray-100 ">
            {galleryImages.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation={{
                  nextEl: '.swiper-button-next-custom',
                  prevEl: '.swiper-button-prev-custom',
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                grabCursor={true}
                className="h-full w-full group/swiper"
              >
                {galleryImages.map((img, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative h-full w-full overflow-hidden">
                      <Image
                        src={img}
                        alt={`${salon?.name} - ${index}`}
                        fill
                        className={
                          img.includes("/No image available.png")
                            ? "object-contain p-12 opacity-30 transition-transform duration-700"
                            : "object-cover transition-transform duration-700"
                        }
                        sizes="(max-width: 1024px) 100vw, 1200px"
                        priority={index === 0}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.indexOf("/No image available.png") === -1) {
                            target.src = "/No image available.png";
                            target.className = "object-contain p-12 opacity-30 transition-transform duration-700";
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 pointer-events-none" />
                    </div>
                  </SwiperSlide>
                ))}

                <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </Swiper>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 gap-3">
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="font-medium">{t("noImageAvailable")}</span>
              </div>
            )}

            <style jsx global>{`
    .swiper-pagination-bullet {
      background: white !important;
      opacity: 0.7;
      width: 10px;
      height: 10px;
      transition: all 0.3s ease;
    }
    .swiper-pagination-bullet-active {
      background: #7BAE6A !important;
      opacity: 1;
      width: 25px;
      border-radius: 5px;
    }
    .swiper-button-disabled {
      display: none !important;
    }
  `}</style>
          </div>

          <div className="flex flex-col-reverse lg:flex-row-reverse gap-8">
            <div className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
              <div className="hidden lg:block space-y-6">
                {activeTab === "services" && <OrderSummaryCard onPay={onPay} />}
                {activeTab === "packages" && <OrderSummaryPackagesCard onPay={onPay} />}
              </div>

              {salon?.policy && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-bold text-gray-900">
                      {t("salonDetailsInfo.policy")}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {salon.policy}
                  </p>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-gray-900">
                    {t("salonDetailsInfo.similarSalons")}
                  </h3>
                </div>

                {relatedSalons.length > 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-4 gap-3">
                    {relatedSalons.map((s) => (
                      <SalonCard key={s.id} salon={s} />
                    ))}

                    {lastFetchCount === RELATED_LIMIT && (
                      <button
                        onClick={async () => {
                          if (!id) return;
                          const nextPage = relatedPage + 1;
                          const more = await ServiceProvider.getRelated(id, nextPage, RELATED_LIMIT);
                          if (more.length > 0) {
                            setRelatedSalons((prev) => [...prev, ...more]);
                            setRelatedPage(nextPage);
                            setLastFetchCount(more.length);
                          } else {
                            setLastFetchCount(0);
                          }
                        }}
                        className="w-full py-2.5 mt-2 text-xs font-bold text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
                      >
                        {t("salonDetailsInfo.loadMore")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {t("salonDetailsInfo.noSimilarSalons")}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-8">
              {salon && (
                <SalonDetailsCard
                  salon={salon}
                  inputLabel={salon.category ?? ""}
                  onFavoriteClick={toggleFavorite}
                  isFavorited={isSalonFavorite}
                />
              )}

              <div className="flex gap-8 border-b border-gray-100 px-2">
                <button
                  onClick={() => setActiveTab("services")}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "services"
                    ? "text-[#7BAE6A] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#7BAE6A] after:rounded-full"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {t("salonDetailsInfo.services")}
                </button>
                <button
                  onClick={() => setActiveTab("packages")}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "packages"
                    ? "text-[#7BAE6A] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#7BAE6A] after:rounded-full"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {t("salonDetailsInfo.packages", { defaultValue: "Packages" })}
                </button>
              </div>

              {activeTab === "services" && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50/50">
                    <CategoryTabs
                      categories={categories}
                      active={safeActiveCategory}
                      onChange={setActiveCategory}
                    />
                  </div>
                  <div className="px-5 pb-6 pt-2">
                    <ServiceCardsList visibleCount={visibleCount} activeCategory={safeActiveCategory} />
                    {providerServices.length > 0 && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => router.push(`/services?category=${safeActiveCategory}`)}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                          {t("showAll")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "packages" && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50/50">
                    <CategoryTabs
                      categories={packageCategories}
                      active={safePackageCategory}
                      onChange={setPackageCategory}
                    />
                  </div>
                  <div className="px-5 pb-6 pt-2">
                    <PackageCardsList visibleCount={visibleCount} activeCategory={safePackageCategory} />
                    {providerPackages.length > 0 && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => router.push(`/packages?providerId=${id}`)}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                          {t("showAll")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="lg:hidden space-y-6">
                {activeTab === "services" && selectedServicesIDs.length > 0 && (
                  <OrderSummaryCard onPay={onPay} />
                )}
                {activeTab === "packages" && selectedPackageIDs.length > 0 && (
                  <OrderSummaryPackagesCard onPay={onPay} />
                )}
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("salonDetailsInfo.ourTeam")}
                  </h2>
                </div>
                <TeamMemberViewOnly
                  members={salon?.employees ?? []}
                  salonId={id as string}
                  className="w-full"
                />              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("salonDetailsInfo.reviews")} ({reviewsCount})
                  </h2>
                  <button
                    type="button"
                    onClick={() => id && router.push(`/reviews/${id}`)}
                    className="text-[#7BAE6A] text-sm font-bold hover:bg-green-50 px-3 py-1 rounded-lg transition-colors"
                  >
                    {t("showAll")}
                  </button>
                </div>

                <div>
                  {reviewsLoading ? (
                    <div className="text-sm text-gray-400 py-4 animate-pulse">Loading...</div>
                  ) : reviewsError ? (
                    <div className="text-sm text-red-400">{reviewsError}</div>
                  ) : reviewsCount === 0 ? (
                    <div className="text-sm text-gray-400 italic">
                      {t("salonDetailsInfo.noReviews")}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <ReviewsList reviews={reviews} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}