"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Star, ArrowLeft, Mail, Briefcase } from "lucide-react";
import {
  employeesServices,
  EmployeeFullInfo,
} from "@/integration/services/employees/employees.service";
import { employeesService } from "@/integration/services/admin/employees.service";

export default function SuperAdminEmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");

  const employeeId = params?.employeeId as string;
  const salonId = params?.id as string;

  const [employee, setEmployee] = useState<EmployeeFullInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!employeeId) return;

    let alive = true;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await employeesServices.getPublicFullInfo(employeeId);
        if (!alive) return;
        setEmployee(data);
      } catch (err) {
        console.error("Failed to fetch employee info:", err);
        if (alive) setError(t("employeePage.noServices"));
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchEmployee();
    return () => {
      alive = false;
    };
  }, [employeeId, t]);

  const handleBack = () => {
    router.push(`/super-admin-dashboard/salons/${salonId}`);
  };

  const imageSrc = employee?.avatarUrl || employee?.profileImage || "";
  const displayImage = !!imageSrc && !imageError;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#79A66B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">{error || t("noDataAvailable")}</p>
        <button
          onClick={handleBack}
          className="text-[#79A66B] hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] py-8 px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-3xl">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#79A66B] transition-colors"
        >
          <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          <span>{t("back")}</span>
        </button>

        {/* Profile Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#79A66B]/20 flex-shrink-0 bg-gray-100">
              {displayImage ? (
                <Image
                  src={imageSrc}
                  alt={employee.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employeesService.getGenderIcon()}
                  alt={employee.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex-1 text-center sm:text-start">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {employee.name}
              </h1>

              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= Math.round(employee.averageRating)
                          ? "text-orange-400 fill-orange-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {employee.averageRating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-sm text-gray-500">
                  ({employee.totalRatings} {t("employeePage.totalRatings")})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#79A66B]" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.role && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#79A66B]" />
                    <span>{employee.role}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("employeePage.services")}
          </h2>

          {employee.services && employee.services.length > 0 ? (
            <div className="grid gap-3">
              {employee.services.map((service) => (
                <div
                  key={service.serviceItemId}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {service.isActive ? t("active") : t("inactive")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              {t("employeePage.noServices")}
            </p>
          )}
        </div>

        {/* Ratings Section */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("employeePage.ratings")}
          </h2>

          {employee.ratings && employee.ratings.length > 0 ? (
            <div className="space-y-4">
              {employee.ratings.map((rating, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= rating.rating
                            ? "text-orange-400 fill-orange-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-700">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              {t("employeePage.noRatings")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
