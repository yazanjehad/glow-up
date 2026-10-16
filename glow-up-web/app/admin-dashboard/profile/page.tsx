"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { get, patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface UpdateResponse {
  nextAction?: "VERIFY_PHONE";
  phone?: string;
  message?: string;
}

export default function ProviderProfilePage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [pendingPhone, setPendingPhone] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await get<ProfileData>("/users/profile-provider", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data;
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isRTL ? "فشل تحميل الملف الشخصي" : "Failed to load profile"),
      );
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem(TOKEN_KEY);
      const payload: any = { name };

      if (email && email !== profile?.email) {
        payload.email = email;
      }

      if (phone && phone !== profile?.phone) {
        payload.phone = phone;
      }

      const res = await patch<UpdateResponse>("/users/profile-provider", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data?.nextAction === "VERIFY_PHONE") {
        setPendingPhone(res.data.phone || phone);
        setShowOtp(true);
        setSuccess(isRTL ? "تم إرسال رمز التحقق" : "Verification code sent");
      } else {
        setSuccess(isRTL ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
        setShowOtp(false);
        setOtpDigits(["", "", "", ""]);
        fetchProfile();
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isRTL ? "فشل تحديث الملف الشخصي" : "Failed to update profile"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 4) return;
    
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem(TOKEN_KEY);
      const payload = {
        phone: pendingPhone,
        code,
      };

      await patch<UpdateResponse>("/users/profile-provider", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setSuccess(isRTL ? "تم التحقق وتحديث رقم الهاتف بنجاح" : "Phone verified and updated successfully");
      setShowOtp(false);
      setOtpDigits(["", "", "", ""]);
      setPendingPhone("");
      fetchProfile();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (isRTL ? "فشل التحقق من الرمز" : "Failed to verify code"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
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
          {isRTL ? "الملف الشخصي" : "Profile"}
        </h2>
        <p className="text-[13px] text-gray-400 mt-1">
          {isRTL ? "إدارة معلومات حسابك الشخصية" : "Manage your personal account information"}
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
              <User className="h-6 w-6 text-[#79a66b]" />
            </div>
            <CardTitle className="text-xl font-bold">
              {isRTL ? "معلومات الحساب" : "Account Information"}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              {isRTL ? "الاسم" : "Name"}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              {isRTL ? "البريد الإلكتروني" : "Email"}
              <span className="text-xs text-gray-400">
                ({isRTL ? "اختياري" : "optional"})
              </span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
              className="h-12 rounded-xl"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              {isRTL ? "رقم الهاتف" : "Phone"}
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isRTL ? "أدخل رقم هاتفك" : "Enter your phone number"}
              className="h-12 rounded-xl"
              dir="ltr"
            />
          </div>

          <Button
            onClick={handleUpdate}
            disabled={saving || !name}
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

      {/* OTP Verification Dialog */}
      <Dialog open={showOtp} onOpenChange={(open) => {
        if (!open) {
          setShowOtp(false);
          setOtpDigits(["", "", "", ""]);
          setError("");
        }
      }}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? "rtl" : "ltr"}>
          <div className="text-center pt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {isRTL ? "رمز التحقق" : "Verification Code"}
            </h3>
            <p className="text-sm text-[#79a66b] mb-1">
              {isRTL
                ? "لقد أرسلنا رمزاً مكوناً من 4 أرقام إلى"
                : "We sent a 4-digit code to"}
            </p>
            <p className="text-base font-medium text-[#79a66b]" dir="ltr">
              {pendingPhone}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 mb-4">
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6" dir="ltr">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpDigits[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#79a66b] focus:ring-2 focus:ring-[#79a66b]/20 outline-none transition-all"
              />
            ))}
          </div>

          <Button
            onClick={handleVerifyOtp}
            disabled={saving || otpDigits.join("").length !== 4}
            className="w-full h-12 bg-[#79A66B] hover:bg-[#6a9460] rounded-xl text-white font-bold"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              isRTL ? "تحقق" : "Verify"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
