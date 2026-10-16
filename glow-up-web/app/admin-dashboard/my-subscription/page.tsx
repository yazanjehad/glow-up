"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Calendar,
  Clock,
  Percent,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  SaudiRiyal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subscriptionsService } from "@/integration/services/subscriptions/subscriptions.service";

export default function MySubscriptionPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await subscriptionsService.getMySubscription();
      console.log("data : ", data);
      setSubscription(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isRTL ? "فشل تحميل الاشتراك" : "Failed to load subscription"),
      );
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
            <CheckCircle className="h-3 w-3 me-1" />
            {isRTL ? "نشط" : "Active"}
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
            <XCircle className="h-3 w-3 me-1" />
            {isRTL ? "منتهي" : "Expired"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">
            <AlertCircle className="h-3 w-3 me-1" />
            {isRTL ? "ملغي" : "Cancelled"}
          </Badge>
        );
      default:
        return null;
    }
  };

  const plan = subscription?.plan;
  const remainingDays = subscription?.remainingDays ?? 0;

  const translatePlanName = (name: string) => {
    if (!name) return "";

    const map: Record<string, string> = {
      "خطة التوفير": "Saving Plan",
    };

    return isRTL ? name : map[name] || name;
  };

  const translatePaymentMethod = (method: string) => {
    if (!method) return "";

    const map: Record<string, { ar: string; en: string }> = {
      BANK: { ar: "بنك", en: "Bank" },
      BANK_TRANSFER: { ar: "تحويل بنكي", en: "Bank Transfer" },
      CASH: { ar: "نقدًا", en: "Cash" },
      CARD: { ar: "بطاقة", en: "Card" },
      CREDIT_CARD: { ar: "بطاقة ائتمان", en: "Credit Card" },
    };

    if (isRTL) {
      return map[method]?.ar || method.replace(/_/g, " ");
    }

    return map[method]?.en || method.replace(/_/g, " ");
  };
  if (loading) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
        <div className="mb-8">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="p-6 animate-in fade-in duration-500"
    >
      <header className="mb-8 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">
              {isRTL ? "اشتراكي" : "My Subscription"}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {isRTL
                ? "عرض تفاصيل خطة الاشتراك الحالية"
                : "View your current subscription plan details"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscription}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!subscription ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CreditCard className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isRTL ? "لا يوجد اشتراك نشط" : "No Active Subscription"}
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              {isRTL
                ? "لم تقم بالاشتراك في أي خطة حتى الآن. تواصل مع الإدارة للاشتراك في خطة مناسبة."
                : "You haven't subscribed to any plan yet. Contact administration to subscribe to a suitable plan."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div
              className={`h-2 ${
                subscription.status === "ACTIVE"
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-red-400 to-rose-500"
              }`}
            />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      plan?.type === "PERCENT"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {plan?.type === "PERCENT" ? (
                      <Percent className="h-6 w-6" />
                    ) : (
                      <Clock className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {translatePlanName(plan?.name) ||
                        (isRTL ? "خطة الاشتراك" : "Subscription Plan")}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan?.type === "PERCENT"
                        ? isRTL
                          ? "خطة عمولة"
                          : "Commission Based"
                        : isRTL
                          ? "خطة زمنية"
                          : "Duration Based"}
                    </p>
                  </div>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isRTL ? "السعر" : "Price"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-3xl font-bold text-green-700">
                    <span>{plan?.price || 0}</span>
                    <SaudiRiyal className="h-5 w-5 text-green-700" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isRTL ? "المدة الإجمالية" : "Total Duration"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {plan?.durationDays || 0}{" "}
                    <span className="text-lg font-normal opacity-80">
                      {isRTL ? "يوم" : "days"}
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isRTL ? "الأيام المتبقية" : "Remaining Days"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    {remainingDays}{" "}
                    <span className="text-lg font-normal opacity-80">
                      {isRTL ? "يوم" : "days"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">
                        {isRTL ? "تاريخ البدء" : "Start Date"}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {subscription.startDate
                          ? formatDate(subscription.startDate)
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">
                        {isRTL ? "تاريخ الانتهاء" : "End Date"}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {subscription.endDate
                          ? formatDate(subscription.endDate)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {subscription.paymentMethod && (
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 w-fit px-3 py-1.5 rounded-full border border-gray-100">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>
                    {isRTL ? "طريقة الدفع:" : "Payment Method:"}{" "}
                    <span className="font-bold text-gray-600">
                      {translatePaymentMethod(subscription.paymentMethod)}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
