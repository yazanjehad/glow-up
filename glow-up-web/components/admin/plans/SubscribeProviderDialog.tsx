"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User, CreditCard, CheckCircle, Info, Loader2 } from "lucide-react";
import { subscriptionsService } from "@/integration/services/subscriptions/subscriptions.service";
import { Plan } from "@/integration/services/subscriptions/subscriptions.types";
import { couponsService, ProviderOption, ProviderStatus } from "@/integration/services/admin/coupons.service";
import { cn } from "@/lib/utils";

interface SubscribeProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "CASH", labelEn: "Cash", labelAr: "نقدي" },
];

export default function SubscribeProviderDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: SubscribeProviderDialogProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [providerId, setProviderId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);

  // تحميل المزودين من API (مع الدعم لكل حالة بشكل منفصل)
  const loadProviders = async (search = "") => {
    try {
      setLoadingProviders(true);

      const allProviders: ProviderOption[] = [];
      for (const status of ["PENDING", "UNPAID", "APPROVED"] as ProviderStatus[]) {
        const providersByStatus = await couponsService.getProvidersByStatus([status], search);
        allProviders.push(...providersByStatus);
      }
      

      setProviders(search ? allProviders : allProviders.slice(0, 10));
    } catch (e: any) {
      console.error("Failed to load providers:", e);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    if (open) {
      setProviderId("");
      setPaymentMethod("");
      setNotes("");
      setError("");
      setSuccess(false);
      setSearchQuery("");
      loadProviders();
    }
  }, [open]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (open) loadProviders(searchQuery);
    }, 500);

    return () => clearTimeout(delay);
  }, [searchQuery, open]);

  const handleSubmit = async () => {
    if (!providerId || !paymentMethod || !plan) {
      setError(isRTL ? "يرجى إكمال البيانات المطلوبة" : "Please complete required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await subscriptionsService.subscribeProvider({
        planId: plan._id,
        providerId,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || (isRTL ? "حدث خطأ ما" : "Error occurred")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[550px] overflow-hidden flex flex-col p-0 gap-0"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4 scale-110">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRTL ? "تم بنجاح!" : "Success!"}
            </h3>
            <p className="text-muted-foreground">
              {isRTL
                ? "تم تفعيل اشتراك المزود بنجاح"
                : "Provider subscription activated successfully"}
            </p>
          </div>
        )}

        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            {isRTL ? "اشتراك مزود جديد" : "New Provider Subscription"}
          </DialogTitle>
          <DialogDescription className="pt-2" asChild>
            <div>
              {plan && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-secondary">
                  <div className="bg-primary text-white p-1.5 rounded-md">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold opacity-70">
                      {isRTL ? "الخطة المختارة" : "Selected Plan"}
                    </p>
                    <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[60vh]">
          {/* Provider Selection Section */}
          <div className="space-y-3">
            <Label className="text-sm font-bold flex justify-between">
              {isRTL ? "1. اختيار المزود" : "1. Select Provider"}
              <span className="text-primary text-[10px] font-normal px-2 bg-primary/5 rounded-full">
                {providers.length} {isRTL ? "مزود متاح" : "providers available"}
              </span>
            </Label>

            <div className="relative group">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? "ابحث بالاسم..." : "Search by name..."}
                className="ps-9 bg-muted/30 focus-visible:ring-primary border-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              {loadingProviders ? (
                <div className="flex flex-col items-center py-8 gap-2 opacity-50">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs">{isRTL ? "جاري جلب القائمة..." : "Fetching list..."}</p>
                </div>
              ) : providers.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "لا يوجد نتائج" : "No results found"}
                  </p>
                </div>
              ) : (
                providers.map((provider) => (
                  <button
                    key={provider._id}
                    type="button"
                    onClick={() => setProviderId(provider._id)}
                    className={cn(
                      "group relative w-full p-3 rounded-xl border transition-all duration-200 flex items-center gap-3",
                      providerId === provider._id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        providerId === provider._id
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                      )}
                    >
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="font-semibold text-sm">{provider.name}</p>
                    </div>
                    {providerId === provider._id && (
                      <CheckCircle className="h-5 w-5 text-primary ms-auto animate-in zoom-in duration-300" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Payment and Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {isRTL ? "2. طريقة الدفع" : "2. Payment Method"}
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder={isRTL ? "اختر الطريقة" : "Method"} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value} className="py-3">
                      {isRTL ? method.labelAr : method.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-bold">
                {isRTL ? "3. ملاحظات إضافية" : "3. Additional Notes"}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? "أي تفاصيل أخرى..." : "Any other details..."}
                className="min-h-[44px] max-h-[100px] rounded-xl resize-none"
                rows={1}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl animate-in shake-200">
              <p className="text-xs text-destructive font-medium flex items-center gap-2">
                <Info className="h-3 w-3" /> {error}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 flex flex-row gap-3 bg-muted/20">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 rounded-xl h-12"
          >
            {isRTL ? "إغلاق" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !providerId || !paymentMethod}
            className="flex-[2] rounded-xl h-12 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {isRTL ? "جاري المعالجة..." : "Processing..."}
              </>
            ) : (
              isRTL ? "إتمام الاشتراك" : "Confirm Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}