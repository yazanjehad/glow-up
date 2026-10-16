"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Save, Loader2, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

type AppointmentStrategy = "DIRECT" | "NEED_APPROVAL";

export default function ProviderSettingsPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [appointmentStrategy, setAppointmentStrategy] = useState<AppointmentStrategy>("DIRECT");
  const [originalStrategy, setOriginalStrategy] = useState<AppointmentStrategy>("DIRECT");

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const provider: any = await ServiceProvider.getMe();
      const strategy = (provider?.appointmentStrategy as AppointmentStrategy) || "DIRECT";

      setAppointmentStrategy(strategy);
      setOriginalStrategy(strategy);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        (isRTL ? "فشل تحميل الإعدادات" : "Failed to load settings"),
      );
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (appointmentStrategy === originalStrategy) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) throw new Error("Missing providerId");

      await patch(
        `/providers/${providerId}`,
        { appointmentStrategy },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      setOriginalStrategy(appointmentStrategy);
      setSuccess(isRTL ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        (isRTL ? "فشل حفظ الإعدادات" : "Failed to save settings"),
      );
    } finally {
      setSaving(false);
    }
  };

  const getStrategyLabel = (strategy: AppointmentStrategy) => {
    if (strategy === "DIRECT") {
      return isRTL ? "مباشر (بدون موافقة)" : "Direct (No Approval)";
    }
    return isRTL ? "يتطلب موافقة" : "Needs Approval";
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
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6 animate-in fade-in duration-500">
      <header className="mb-8 px-1">
        <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">
          {isRTL ? "الإعدادات" : "Settings"}
        </h2>
        <p className="text-[13px] text-gray-400 mt-1">
          {isRTL ? "إدارة إعدادات الصالون" : "Manage your salon settings"}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-4">
          <p className="text-sm text-green-600 font-medium">{success}</p>
        </div>
      )}

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#e2ecdf]">
              <Settings className="h-6 w-6 text-[#79a66b]" />
            </div>
            <CardTitle className="text-xl font-bold">
              {isRTL ? "إعدادات الحجز" : "Booking Settings"}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-gray-400" />
              {isRTL ? "استراتيجية الحجز" : "Appointment Strategy"}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {isRTL
                ? "حدد كيفية معالجة الحجوزات الجديدة"
                : "Define how new appointments are handled"}
            </p>
            <Select
              value={appointmentStrategy}
              onValueChange={(value) => setAppointmentStrategy(value as AppointmentStrategy)}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <SelectTrigger className="h-12 rounded-xl text-start">
                <SelectValue placeholder={isRTL ? "اختر الاستراتيجية" : "Select strategy"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT" className="text-start focus:bg-gray-100 hover:bg-gray-100 !text-gray-900 focus:!text-gray-900 hover:!text-gray-900">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {isRTL ? "مباشر" : "Direct"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isRTL ? "يتم تأكيد الحجز تلقائياً" : "Booking is confirmed automatically"}
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="NEED_APPROVAL" className="text-start focus:bg-gray-100 hover:bg-gray-100 !text-gray-900 focus:!text-gray-900 hover:!text-gray-900">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {isRTL ? "يتطلب موافقة" : "Needs Approval"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isRTL ? "تحتاج الموافقة على الحجز يدوياً" : "Booking needs manual approval"}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                <span className="font-medium">
                  {isRTL ? "الاستراتيجية الحالية: " : "Current strategy: "}
                </span>
                {getStrategyLabel(originalStrategy)}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || appointmentStrategy === originalStrategy}
            className="w-full h-12 bg-[#79A66B] hover:bg-[#6a9460] rounded-xl text-white font-bold mt-4"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isRTL ? "حفظ التغييرات" : "Save Changes"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
