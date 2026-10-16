"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";


import CategoryTabs from "@/components/services/CategoryTabs";
import ServiceCardsList from "@/components/services/ServiceCardsList";
import PackageCardsList from "@/components/packages/PackageCardsList";
import TeamMemberViewOnly from "@/components/team/TeamMemberViewOnly";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import SalonDetailsCard from "@/components/booking-details/SalonDetailsCard";
import { SalonUi } from "@/integration/services/provider/provider.types";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { useBookingStore } from "@/store/bookingStore";
import { useServicesStore } from "@/store/serviceStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";
import { emptyReviewsApiResponse, ReviewUI } from "@/app/models/Review-types";
import { RatingsService } from "@/integration/services/Ratings/ratings.service";
import { ProviderPackagesService } from "@/integration/services/provider-packages/provider-packages.service";
import { mapProviderPackagesToUi } from "@/integration/services/provider-packages/provider-packages.types";
import type { ProviderPackageDto } from "@/integration/services/provider-packages/provider-packages.types";

export default function SuperAdminSalonDetailsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [salon, setSalon] = useState<SalonUi>();
  const [, setLoading] = useState(true);
  const setSelectedProviderID = useBookingStore((s) => s.setSelectedProviderID);
  const setProviderServices = useBookingStore((s) => s.setProviderServices);
  const providerServices = useBookingStore((s) => s.providerServices);
  const providerPackages = useBookingStore((s) => s.providerPackages);
  const setProviderPackages = useBookingStore((s) => s.setProviderPackages);
  const [reviewsData, setReviewsData] = useState<ReviewUI>(
    emptyReviewsApiResponse(),
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "packages">(
    "services",
  );
  const [packageCategory, setPackageCategory] = useState<string>("");

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
      const msg =
        e?.response?.data?.message || e?.message || "فشل تحميل المراجعات";
      if (!cancelled) setReviewsError(msg);
    } finally {
      if (!cancelled) setReviewsLoading(false);
    }
  };

  const fetchSalon = async (providerId: string) => {
    try {
      setLoading(true);
      const data = await ServiceProvider.getById(
        providerId,
        i18n.language as any,
      );
      setSalon(data);
      const servicesItems = await ServiceProvider.getServicesItems(
        providerId,
        i18n.language as any,
      );
      setProviderServices(servicesItems);
      setSelectedProviderID(providerId);

      const rawPackages = (data as { packages?: ProviderPackageDto[] }).packages;
      if (Array.isArray(rawPackages) && rawPackages.length > 0) {
        const uiPackages = mapProviderPackagesToUi(rawPackages).filter(
          (p) => p.isActive !== false,
        );
        setProviderPackages(uiPackages);
      } else {
        const packagesUi =
          await ProviderPackagesService.getByProviderIdAsUi(providerId);
        setProviderPackages(packagesUi);
      }
    } catch (error) {
      console.error("fetchSalon error:", error);
    } finally {
      setLoading(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, i18n.language]);

  const [activeCategory, setActiveCategory] = useState<string>("exclusive");

  const categories = useMemo(() => {
    const unique = new Set(
      (providerServices ?? []).map((s: any) =>
        String(s?.category ?? s?.categoryLabel ?? ""),
      ),
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

  if (!id) return null;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/super-admin-dashboard/salons")}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span className={isRTL ? "rotate-180" : ""}>←</span>
            <span>{t("back")}</span>
          </button>
        </div>

        <div className=" relative group h-[400px] md:h-[550px] rounded-[2rem] overflow-hidden  mb-10 bg-gray-100  ">
          {galleryImages.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={{
                nextEl: ".swiper-button-next-custom",
                prevEl: ".swiper-button-prev-custom",
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
                      className="object-cover transition-transform duration-700 "
                      sizes="(max-width: 1024px) 100vw, 1200px"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 pointer-events-none" />
                  </div>
                </SwiperSlide>
              ))}

              <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </Swiper>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 gap-3">
              <svg
                className="w-12 h-12 opacity-20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
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
              background: #7bae6a !important;
              opacity: 1;
              width: 25px;
              border-radius: 5px;
            }
            .swiper-button-disabled {
              display: none !important;
            }
          `}</style>
        </div>

        <div className="flex flex-col lg:flex-row-reverse gap-8">
          <div className="flex-1 space-y-8">
            {salon && (
              <SalonDetailsCard
                salon={salon}
                inputLabel={salon.category ?? ""}
                showFavorite={false}
                showChat={false}
              />
            )}

            <div className="flex gap-8 border-b border-gray-100 px-2">
              <button
                onClick={() => setActiveTab("services")}
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === "services"
                    ? "text-[#7BAE6A] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#7BAE6A] after:rounded-full"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t("salonDetailsInfo.services")}
              </button>
              <button
                onClick={() => setActiveTab("packages")}
                className={`pb-4 text-sm font-bold transition-all relative ${
                  activeTab === "packages"
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
                  <ServiceCardsList
                    visibleCount={visibleCount}
                    activeCategory={safeActiveCategory}
                    selectable={false}
                  />
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
                  <PackageCardsList
                    visibleCount={visibleCount}
                    activeCategory={safePackageCategory}
                    selectable={false}
                  />
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("salonDetailsInfo.ourTeam")}
                </h2>
              </div>
              <TeamMemberViewOnly
                members={salon?.employees ?? []}
                salonId={id}
                className="w-full"
                getEmployeeHref={(sid, eid) => `/super-admin-dashboard/salons/${sid}/employee/${eid}`}
              />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("salonDetailsInfo.reviews")} ({reviewsCount})
                </h2>
                <button
                  type="button"
                  onClick={() => id && router.push(`/super-admin-dashboard/salons/${id}/reviews`)}
                  className="text-[#7BAE6A] text-sm font-bold hover:bg-green-50 px-3 py-1 rounded-lg transition-colors"
                >
                  {t("showAll")}
                </button>
              </div>

              <div>
                {reviewsLoading ? (
                  <div className="text-sm text-gray-400 py-4 animate-pulse">
                    Loading...
                  </div>
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

            {/* Documents Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {t("salonDetailsInfo.documents")}
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {salon?.documents?.length ?? 0}
                </span>
              </div>

              {(!salon?.documents || salon.documents.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium">{t("salonDetailsInfo.noDocuments")}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {salon.documents.map((doc) => {
                    const ext = (doc.filename || doc.fileUrl || "").split(".").pop()?.toLowerCase() ?? "";
                    const isPdf = ext === "pdf";
                    const isImg = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
                    const iconBg = isPdf ? "bg-red-50" : isImg ? "bg-blue-50" : "bg-amber-50";
                    const iconColor = isPdf ? "text-red-500" : isImg ? "text-blue-500" : "text-amber-500";
                    const extLabel = ext ? ext.toUpperCase() : "FILE";

                    return (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-4 items-start p-4 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200 cursor-pointer"
                      >
                        {/* File icon */}
                        <div className={`w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center gap-1 ${iconBg} border border-gray-100 group-hover:border-amber-200 transition-colors`}>
                          <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className={`text-[9px] font-bold tracking-wide ${iconColor}`}>{extLabel}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mb-1.5">
                            {doc.typeName || doc.typeCode || t("salonDetailsInfo.document")}
                          </span>
                          <p className="text-sm font-medium text-gray-800 truncate" title={doc.filename}>
                            {doc.filename}
                          </p>
                          {doc.uploadedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(doc.uploadedAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>

                        {/* External link icon */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

