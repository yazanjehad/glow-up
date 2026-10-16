"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import PaymentCenter from "@/components/payment-details/PaymentCenter";
import CardManagement from "@/components/payment-details/CardManagement";
import UsePackageOption from "@/components/payment-details/UsePackageOption";
import CouponPaymentCard from "@/components/payment-details/CouponPaymentCard";
import { useCustomDialog, CustomDialog } from "@/components/ui/custom-dialog";
import BookingVerification from "@/components/shared/BookingVerification/BookingVerificationFlow";
import BookNow from "@/components/payment-details/BookNow";
import { AppointmentsService, toApiPaymentMethod } from "@/integration/services/appointments/appointments.service";
import type { PackagePaymentMethod } from "@/integration/services/user-packages/user-packages.types";
import { getToken } from "@/integration/services/auth/authServices";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPackagesService } from "@/integration/services/user-packages/user-packages.service";
import type { UserPackageResponseDto } from "@/integration/services/user-packages/user-packages.types";
import { CouponService } from "@/integration/services/coupon/coupon.service";
import type { CreateCouponDto } from "@/integration/services/coupon/coupon.types";
import { useBookingStore } from "@/store/bookingStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";
import { useServicesStore } from "@/store/serviceStore";
import { usePackagesStore } from "@/store/packageStore";
import { getUsedCouponCodes, markCouponCodeAsUsed } from "@/lib/utils";


function getErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as Record<string, unknown>;
  const data = e?.response && typeof e.response === "object" ? (e.response as Record<string, unknown>)?.data : null;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
    if (typeof d.error === "string" && d.error.trim()) return d.error.trim();
    const details = d.details ?? d.errors;
    if (Array.isArray(details) && details.length > 0 && typeof details[0] === "object" && details[0] !== null) {
      const msg = (details[0] as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.trim()) return msg.trim();
    }
    if (details && typeof details === "object" && "message" in details && typeof (details as { message?: unknown }).message === "string") {
      return String((details as { message: string }).message);
    }
  }
  if (typeof e.message === "string" && e.message.trim()) return e.message.trim();
  return fallback;
}

const Page: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMultiMode = searchParams?.get("mode") === "multi";
  const isPackagePurchase = searchParams?.get("mode") === "package";
  const isGiftPurchase = searchParams?.get("mode") === "gift";
  
  const {
    paymentMethod,
    setPaymentMethod,
    selectedUserPackageId,
    setSelectedUserPackageId,
    selectedProviderID,
    selectedServiceID: bookingSelectedServiceID,
    setNotes,
    hasHydrated: bookingHasHydrated,
  } = useBookingStore();
  const packageIDs = usePackagesStore((s) => s.packageIDs);
  const selectedPackageID = usePackagesStore((s) => s.selectedPackageID);
  const resetPackages = usePackagesStore((s) => s.resetPackages);
  const servicesIDS = useServicesStore((s) => s.servicesIDS);
  const servicesStoreSelectedServiceID = useServicesStore((s) => s.selectedServiceID);
  const servicesHasHydrated = useServicesStore((s) => s.hasHydrated);

  const [userPackages, setUserPackages] = useState<UserPackageResponseDto[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Redirect to home if no booking data is available (e.g., page refresh)
  useEffect(() => {
    if (!bookingHasHydrated || !servicesHasHydrated) return;
    
    const hasServices = servicesIDS?.length > 0 || bookingSelectedServiceID || servicesStoreSelectedServiceID;
    const hasPackages = packageIDs?.length > 0;
    if (!hasServices && !hasPackages && !isGiftPurchase) {
      router.replace("/home");
    }
  }, [servicesIDS, bookingSelectedServiceID, servicesStoreSelectedServiceID, packageIDs, isGiftPurchase, router, bookingHasHydrated, servicesHasHydrated]);


  // خدمة الحجز: إما الخدمات المختارة (multi) أو الخدمة الواحدة من booking
  const serviceItemIds = servicesIDS?.length
    ? servicesIDS
    : bookingSelectedServiceID
      ? [bookingSelectedServiceID]
      : servicesStoreSelectedServiceID
        ? [servicesStoreSelectedServiceID]
        : [];
  const serviceItemIdsKey = serviceItemIds.join(",");

  useEffect(() => {
    const loadPackages = async () => {
      const token = getToken();
      if (!token) {
        setPackagesLoading(false);
        return;
      }

      // إذا ما في خدمة محددة، ما نعرض أي باقات
      if (!serviceItemIds.length) {
        setUserPackages([]);
        setPackagesLoading(false);
        return;
      }

      try {
        const packages = await UserPackagesService.getPackagesByServiceItem(
          token,
          String(serviceItemIds[0])
        );
        setUserPackages(packages);
      } catch {
        setUserPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();

    if (!isGiftPurchase) {
      const couponCode = sessionStorage.getItem("appliedCouponCode");
      const discount = sessionStorage.getItem("appliedCouponDiscount");
      const usedCodes = getUsedCouponCodes();
      if (couponCode && discount && !usedCodes.includes(couponCode.toUpperCase().trim())) {
        setAppliedCouponCode(couponCode);
        setCouponDiscount(parseFloat(discount));
      } else if (couponCode && usedCodes.includes(couponCode.toUpperCase().trim())) {
        sessionStorage.removeItem("appliedCouponCode");
        sessionStorage.removeItem("appliedCouponDiscount");
      }
    } else {
      sessionStorage.removeItem("appliedCouponCode");
      sessionStorage.removeItem("appliedCouponDiscount");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGiftPurchase, serviceItemIdsKey]);

  const [activePayment, setActivePayment] = useState<string | null>(paymentMethod ?? "center");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { open, openDialog, closeDialog } = useCustomDialog();

  const availablePackages = userPackages.filter(
    (pkg) =>
      (pkg.status || "").toUpperCase() === "ACTIVE" &&
      (pkg.items || []).some((item) => Number(item?.remaining ?? 0) > 0)
  );
  const hasAvailablePackages = availablePackages.length > 0;
  const showUsePackageOption = !packagesLoading && !isPackagePurchase && hasAvailablePackages;

  useEffect(() => {
    if (!showUsePackageOption && activePayment === "package") {
      setActivePayment("center");
      setPaymentMethod("center");
      setSelectedUserPackageId(null);
    }
  }, [showUsePackageOption, activePayment, setPaymentMethod, setSelectedUserPackageId]);

  // الدفع عن طريق المركز هو الخيار الوحيد المتاح حالياً، فنختاره افتراضياً
  useEffect(() => {
    if (!activePayment) {
      setActivePayment("center");
      setPaymentMethod("center");
    }
  }, [activePayment, setPaymentMethod]);

  const handlePaymentMethodChange = useCallback(
    (method: string | null) => {
      setBookingError(null);
      setActivePayment(method);
      setPaymentMethod(method);

      if (method !== "package") {
        setSelectedUserPackageId(null);
      } else if (userPackages.length > 0) {
        const availablePackages = userPackages.filter(
          (pkg) =>
            pkg.status === "ACTIVE" &&
            pkg.items.some((item) => item.remaining > 0)
        );
        if (availablePackages.length > 0) {
          setSelectedUserPackageId(availablePackages[0]._id);
        }
      }
    },
    [setPaymentMethod, setSelectedUserPackageId, userPackages]
  );

  const handleBookingAfterVerification = async () => {
    setBookingError(null);
    setIsSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        setIsSubmitting(false);
        return;
      }

      if (isGiftPurchase) {
        const receiverPhone = sessionStorage.getItem("giftReceiverPhone");
        if (!receiverPhone) {
          return;
        }

        const bookingState = useBookingStore.getState();
        const servicesState = useServicesStore.getState();

        const providerId =
          bookingState.selectedProviderID || servicesState.providerID || "";
        if (!providerId) {
          return;
        }

        // فقط خدمات هذا البروفايدر (من providerServices) عشان ما نرسل خدمة من سالون ثاني
        const providerServiceIds = (bookingState.providerServices ?? []).map(
          (s: any) => String(s?.id ?? s?._id ?? "")
        ).filter(Boolean);

        const selectedIds =
          servicesState.servicesIDS?.length > 0
            ? servicesState.servicesIDS
            : bookingState.selectedServiceID
              ? [bookingState.selectedServiceID]
              : [];

        const serviceIdsForGift = selectedIds.filter((id) =>
          providerServiceIds.includes(id)
        );

        if (serviceIdsForGift.length === 0) {
          return;
        }

        const couponData: CreateCouponDto = {
          providerId,
          services: serviceIdsForGift.map((id) => ({ serviceId: id })),
          receivesPhone: receiverPhone,
        };

        try {
          await CouponService.createCoupon(token, couponData);
          sessionStorage.setItem(
            "bookingSuccessSnapshot",
            JSON.stringify({
              mode: "single",
              selectedProviderID: bookingState.selectedProviderID,
              selectedServiceID: bookingState.selectedServiceID,
              packageIDs: packageIDs ?? [],
              coupon: null,
            }),
          );
          sessionStorage.removeItem("giftReceiverPhone");
          setIsSubmitting(false);
          closeDialog();
          router.replace("/booking-success");
          return;
        } catch (couponErr: any) {
          throw couponErr;
        }
      }

      if (isPackagePurchase) {
        const packageId = selectedPackageID || packageIDs[0];
        const providerId = selectedProviderID || useBookingStore.getState().selectedProviderID;
        if (!providerId || !packageId) {
          setBookingError(t("paymentDetails.errorMissingPackage"));
          return;
        }
        sessionStorage.setItem(
          "bookingSuccessSnapshot",
          JSON.stringify({
            mode: "package",
            selectedProviderID: providerId,
            selectedServiceID: bookingSelectedServiceID,
            packageIDs: packageIDs ?? [],
            coupon: null,
          }),
        );
        await UserPackagesService.purchasePackage(token, {
          providerId,
          packageId,
          paymentMethod: toApiPaymentMethod(activePayment) as PackagePaymentMethod,
        });
        resetPackages();
        setSelectedUserPackageId(null);
        setIsSubmitting(false);
        closeDialog();
        router.replace("/booking-success");
        return;
      }

// الكوبون: الـ API يقبل CASH/VISA/WALLET/PACKAGE فقط، نمرّر CASH مع couponCode
const paymentMethodApi = toApiPaymentMethod(activePayment);

const multiItems = useMultiBookingStore.getState().items;
const multiProvId = useMultiBookingStore.getState().providerId;

const createdAppointment = await AppointmentsService.create(
  isMultiMode,
  paymentMethodApi,
  activePayment === "package" ? selectedUserPackageId : undefined,
  activePayment === "coupon" ? appliedCouponCode : undefined,
);

const appointmentData = Array.isArray(createdAppointment)
  ? createdAppointment[0]
  : createdAppointment;

const appointmentId = (appointmentData as any)?.id || (appointmentData as any)?._id || "";
const finalPriceObj = (appointmentData as any)?.price || {};
const serverDiscount = Number(finalPriceObj.discount) || 0;
const serverTotal = Number(finalPriceObj.finalTotal) ?? 0;

      // Snapshot for booking-details page after redirect
      sessionStorage.setItem(
        "bookingSuccessSnapshot",
        JSON.stringify({
          appointmentId,
          mode: isMultiMode ? "multi" : isPackagePurchase ? "package" : "single",
          selectedProviderID: selectedProviderID || useBookingStore.getState().selectedProviderID,
          selectedServiceID: bookingSelectedServiceID,
          multiBookingItems: isMultiMode ? multiItems : [],
          multiProviderId: isMultiMode ? multiProvId : "",
          packageIDs: packageIDs ?? [],
          coupon:
            activePayment === "coupon" && appliedCouponCode
              ? { code: appliedCouponCode, discount: couponDiscount }
              : serverDiscount > 0
                ? { code: t("paymentDetails.appliedDiscount"), discount: serverDiscount }
                : null,
          serverTotal: serverTotal,
        }),
      );

      if (appliedCouponCode && activePayment === "coupon") {
        markCouponCodeAsUsed(appliedCouponCode);
        setAppliedCouponCode(null);
        setCouponDiscount(0);
        sessionStorage.removeItem("appliedCouponCode");
        sessionStorage.removeItem("appliedCouponDiscount");
      }

      if (activePayment === "package" && selectedUserPackageId) {
        setUserPackages((prev) => prev.filter((p) => p._id !== selectedUserPackageId));
      }

      resetPackages();
      setSelectedUserPackageId(null);
      setNotes("");
      setIsSubmitting(false);
      closeDialog();
      router.replace("/booking-success");
    } catch (error: unknown) {
      let userMessage = getErrorMessage(error, t("paymentDetails.errorGeneric"));
      if (/already have an active package of this type/i.test(userMessage)) {
        const packageId = selectedPackageID || packageIDs[0];
        const sameTypePackages = userPackages.filter((p) => p.packageId === packageId);
        const hasActiveWithRemaining = sameTypePackages.some(
          (p) =>
            (p.status === "ACTIVE" || !p.status) &&
            Array.isArray(p.items) &&
            p.items.some((item) => Number(item?.remaining ?? 0) > 0)
        );
        userMessage = hasActiveWithRemaining
          ? t("paymentDetails.errorAlreadyHasActivePackage")
          : t("paymentDetails.errorAlreadyHasActivePackageUsedUp");
      } else if (/package not found/i.test(userMessage)) {
        userMessage = t("paymentDetails.errorPackageNotFound");
      }
      setBookingError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleBooking = () => {
    if (!activePayment) return;

    if (activePayment === "package" && !selectedUserPackageId) {
      return;
    }

    const authToken = getToken();
    if (!authToken) {
      openDialog();
      return;
    }

    handleBookingAfterVerification();
  };

  const canProceed = () => {
    if (!activePayment) return false;
    if (activePayment === "package" && !selectedUserPackageId) return false;
    if (activePayment === "coupon" && !appliedCouponCode) return false;
    return true;
  };

  return (
    <Layout>
      <main className="min-h-screen flex flex-col items-center p-4 gap-6">
        <div className="w-full max-w-[46rem]">
          <TopBar
            titleKey="paymentMethod"
            iconAriaLabelKey="teamPage.icon"
            icon={<ChevronArrow />}
          />
        </div>

        {showUsePackageOption && (
          <UsePackageOption
            className="w-full"
            userPackages={userPackages}
            selectedPackageId={selectedUserPackageId}
            onSelectPackage={setSelectedUserPackageId}
            isActive={activePayment === "package"}
            onClick={() => handlePaymentMethodChange("package")}
          />
        )}

        {appliedCouponCode && (
          <CouponPaymentCard
            className="w-full"
            couponCode={appliedCouponCode}
            discount={couponDiscount}
            isActive={activePayment === "coupon"}
            onClick={() => handlePaymentMethodChange("coupon")}
          />
        )}

        {/* تم إخفاء خيار الدفع عن طريق بطاقة الائتمان مؤقتاً - الدفع متاح فقط عن طريق المركز
        <CardManagement
          className=""
          activeCardId={activePayment?.startsWith("card-") ? parseInt(activePayment.split("-")[1]) : undefined}
          onSelectCard={(cardId) => handlePaymentMethodChange(`card-${cardId}`)}
        />
        */}

        <PaymentCenter
          className="w-full"
          isActive={activePayment === "center"}
          onClick={() => handlePaymentMethodChange("center")}
        />

        {bookingError && (
          <div className="w-full max-w-[46rem] rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm flex items-center justify-between gap-2">
            <span>{bookingError}</span>
            <button type="button" onClick={() => setBookingError(null)} className="text-red-600 hover:underline shrink-0" aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <div className="flex justify-center w-full mt-4">
          <BookNow
            btnName="confirmBooking"
            disabled={!canProceed() || isSubmitting}
            onClick={handleBooking}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <CustomDialog open={open} onOpenChange={closeDialog}>
            <div className="text-center">
              <BookingVerification
                onVerified={handleBookingAfterVerification}
              />
            </div>
          </CustomDialog>
        </div>
      </main>
    </Layout>
  );
};

export default Page;