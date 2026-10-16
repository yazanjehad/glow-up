"use client";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Clock, CheckCircle, AlertCircle, SaudiRiyal } from "lucide-react";
import { UserPackagesService } from "@/integration/services/user-packages/user-packages.service";
import type { UserPackageResponseDto, PackageItem } from "@/integration/services/user-packages/user-packages.types";
import { getToken } from "@/integration/services/auth/authServices";
import Image from "next/image";

const PackagesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");
  const [packages, setPackages] = useState<UserPackageResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const token = getToken();
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const data = await UserPackagesService.getMyPackages(token);
        setPackages(data);
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        setError("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "USED_UP":
      case "USED":
        return "bg-gray-100 text-gray-600";
      case "EXPIRED":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "USED_UP":
      case "USED":
      case "EXPIRED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#79A66B] border-t-transparent"></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center p-4 md:p-8 gap-6"
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2ECDF] text-[#79A66B]">
            <Package className="w-6 h-6" />
          </div>
          <h1
            className="text-2xl font-bold text-gray-800"
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t("myPackages")}
          </h1>
        </div>

        {/* Empty State */}
        {packages.length === 0 && (
          <div className="bg-white rounded-[1.875rem] shadow-[0_0.5rem_2rem_0_#00000014] border border-gray-100 p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t("noPackages")}</p>
          </div>
        )}

        {/* Packages List */}
        <div className="flex flex-col gap-4">
          {packages
            .filter((pkg) => {
              const isActive = pkg.status === "ACTIVE";
              const hasRemaining = (pkg.items || []).some((item) => item.remaining > 0);
              return isActive && hasRemaining;
            })
            .map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-[1.875rem] shadow-[0_0.5rem_2rem_0_#00000014] border border-gray-100 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Package Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2
                    className="text-xl font-semibold text-gray-800 mb-1"
                    style={{ fontFamily: "DIN Next LT Arabic" }}
                  >
                    {pkg.packageName}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(pkg.purchasedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.status)}`}
                  >
                    {getStatusIcon(pkg.status)}
                    {t(`packageStatus.${pkg.status.toLowerCase()}`)}
                  </span>
                  <span className="text-lg font-bold text-[#79A66B] flex items-center gap-1">
                    {pkg.price}
                    <SaudiRiyal className="w-5 h-5" />
                  </span>
                </div>
              </div>

              {/* Package Items */}
              {pkg.items && pkg.items.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3
                    className="text-sm font-semibold text-gray-600 mb-3"
                    style={{ fontFamily: "DIN Next LT Arabic" }}
                  >
                    {t("packageServices")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pkg.items.map((item: PackageItem, index: number) => (
                      <div
                        key={item.serviceItemId || index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={44}
                              height={44}
                              className="w-11 h-11 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#E2ECDF] flex items-center justify-center">
                              <Package className="w-5 h-5 text-[#79A66B]" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-gray-800 text-[14px] truncate mb-0.5"
                            style={{ fontFamily: "DIN Next LT Arabic" }}
                          >
                            {item.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                            <span className="whitespace-nowrap font-medium">
                              {item.remaining}/{item.total} {t("remaining")}
                            </span>
                            {item.durationMinutes > 0 && (
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                <span className="opacity-50">•</span>
                                <span>
                                  {item.durationMinutes} {t("min")}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress bar below text on mobile, or next to it if space */}
                          <div className="mt-2 w-full max-w-[120px]">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#79A66B] rounded-full transition-all"
                                style={{
                                  width: `${item.total > 0 ? (item.remaining / item.total) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default PackagesPage;
