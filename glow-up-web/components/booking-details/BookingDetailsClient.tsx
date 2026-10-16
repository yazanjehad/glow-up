"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import type { BookingOrderDetails } from "@/app/models/booking-details-types";

import SalonDetailsCard from "@/components/booking-details/SalonDetailsCard";
import BookingOrderDetailsCard from "@/components/booking-details/BookingOrderDetailsCard";
import NotesCard from "@/components/booking-details/NotesCard";
import BookNow from "@/components/payment-details/BookNow";

import { useBookingStore } from "@/store/bookingStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";
import { usePackagesStore } from "@/store/packageStore";

import { ServiceProvider } from "@/integration/services/provider/providerService";
import type { SalonUi, ProviderServiceUiItem } from "@/integration/services/provider/provider.types";
import { CouponService } from "@/integration/services/coupon/coupon.service";
import { AppointmentsService } from "@/integration/services/appointments/appointments.service";
import { getToken } from "@/integration/services/auth/authServices";
import { useCustomDialog, CustomDialog } from "@/components/ui/custom-dialog";
import { getUsedCouponCodes } from "@/lib/utils";
import { toast } from "sonner";
import { getUserFriendlyErrorMessage } from "@/lib/errorMessages";
import { CustomerService } from "@/integration/services/customer/customer.service";

type BookingDetailsClientProps = {
  inputLabel?: string;
  hideGoToPay?: boolean;
};

export default function BookingDetailsClient({ inputLabel, hideGoToPay = false }: BookingDetailsClientProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isMultiMode = searchParams?.get("mode") === "multi";
  const isPackageMode = searchParams?.get("mode") === "package";
  const fromSuccess = searchParams?.get("from") === "success";
  const appointmentIdFromUrl = searchParams?.get("appointmentId") || "";

  const selectedProviderID = useBookingStore((s) => s.selectedProviderID);
  const providerPackages = useBookingStore((s) => s.providerPackages);
  const setSelectedProviderID = useBookingStore((s) => s.setSelectedProviderID);
  const packageIDs = usePackagesStore((s) => s.packageIDs);
  const setPackageIDs = usePackagesStore((s) => s.setPackageIDs);
  const selectedServiceID = useBookingStore((s) => s.selectedServiceID);
  const setSelectedServiceID = useBookingStore((s) => s.setSelectedServiceID);
  const notes = useBookingStore((s) => s.notes);
  const setNotes = useBookingStore((s) => s.setNotes);

  const multiBookingItems = useMultiBookingStore((s) => s.items);
  const multiProviderId = useMultiBookingStore((s) => s.providerId);

  const [salon, setSalon] = useState<SalonUi | null>(null);
  const [services, setServices] = useState<ProviderServiceUiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [successSnapshotRestored, setSuccessSnapshotRestored] = useState(!fromSuccess);

  const [isSalonFavorite, setIsSalonFavorite] = useState(false);
  const { open: couponModalOpen, openDialog: openCouponModal, closeDialog: closeCouponModal } = useCustomDialog();

  const providerId = isMultiMode ? multiProviderId : selectedProviderID;

  const CheckFavorite = async (id: string) => {
    try {
      const res = await CustomerService.isFavorite(id);
      setIsSalonFavorite(res);
    } catch (err) {
      console.error("CheckFavorite error:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!providerId) return;
    try {
      if (isSalonFavorite) {
        await CustomerService.removeFavorite(providerId);
        setIsSalonFavorite(false);
        toast.success(t("salonDetails.removedFromFavorites") || "Removed from favorites");
      } else {
        await CustomerService.setFavorite(providerId);
        setIsSalonFavorite(true);
        toast.success(t("salonDetails.addedToFavorites") || "Added to favorites");
      }
    } catch (err) {
      console.error("toggleFavorite error:", err);
      toast.error(t("error") || "An error occurred");
    }
  };

  // Hydrate booking-details page after redirect from payment-success.
  // This is needed because payment flow clears some store/session values before navigating.
  // If sessionStorage snapshot is not available but we have an appointmentId, fetch from API.
  useEffect(() => {
    if (!fromSuccess) {
      setSuccessSnapshotRestored(true);
      return;
    }

    const restoreFromSnapshot = () => {
      try {
        const raw = sessionStorage.getItem("bookingSuccessSnapshot");
        if (!raw) return false;

        const snap = JSON.parse(raw) as any;

        if (typeof snap?.selectedProviderID === "string" && snap.selectedProviderID.trim()) {
          setSelectedProviderID(String(snap.selectedProviderID));
        }

        if (typeof snap?.selectedServiceID === "string" && snap.selectedServiceID.trim()) {
          setSelectedServiceID(String(snap.selectedServiceID));
        }

        if (Array.isArray(snap?.packageIDs)) {
          const ids = snap.packageIDs.map((x: unknown) => String(x)).filter(Boolean);
          setPackageIDs(ids);
        }

        if (snap?.mode === "multi" || isMultiMode) {
          if (typeof snap?.multiProviderId === "string" && snap.multiProviderId.trim()) {
            useMultiBookingStore.setState({ providerId: snap.multiProviderId });
          }
          if (Array.isArray(snap?.multiBookingItems)) {
            useMultiBookingStore.setState({ items: snap.multiBookingItems });
          }
        }

        if (snap?.coupon && typeof snap.coupon === "object") {
          if (typeof snap.coupon.discount === "number") {
            setCouponDiscount(snap.coupon.discount);
          }
          if (typeof snap.coupon.code === "string" && snap.coupon.code.trim()) {
            setAppliedCouponCode(snap.coupon.code.trim());
          }
        }

        if (typeof snap?.serverTotal === "number") {
          setServerTotal(snap.serverTotal);
        }

        sessionStorage.removeItem("bookingSuccessSnapshot");
        return true;
      } catch {
        return false;
      }
    };

    const fetchFromAppointmentId = async () => {
      if (!appointmentIdFromUrl) return false;

      try {
        const appointment = await AppointmentsService.getById(appointmentIdFromUrl);
        if (!appointment) return false;

        // Get provider ID from the provider object
        const provId = appointment.provider?._id;
        if (provId) {
          setSelectedProviderID(String(provId));
        }

        // Get service IDs from the services array
        if (appointment.services?.length > 0) {
          const serviceIds = appointment.services.map(s => s.serviceItemId);
          if (serviceIds.length === 1) {
            setSelectedServiceID(String(serviceIds[0]));
          } else if (serviceIds.length > 1) {
            // For multi-service bookings, set up the multi booking store
            useMultiBookingStore.setState({ 
              providerId: provId || "",
              items: appointment.services.map(s => ({
                serviceId: s.serviceItemId,
                employeeId: s.employeeId?._id || "",
                date: s.date || "",
                timeSlot: s.timeSlot || { start: "", end: "" },
              }))
            });
          }
        }

        // Set pricing info
        if (appointment.price) {
          setServerTotal(appointment.price.finalTotal || 0);
          if (appointment.price.discount > 0) {
            setCouponDiscount(appointment.price.discount);
          }
        }

        if (appointment.customerNote) {
          setNotes(appointment.customerNote);
        }

        return true;
      } catch (err) {
        console.error("Failed to fetch appointment by ID:", err);
        return false;
      }
    };

    const init = async () => {
      const restoredFromSnapshot = restoreFromSnapshot();
      if (!restoredFromSnapshot && appointmentIdFromUrl) {
        await fetchFromAppointmentId();
      }
      setSuccessSnapshotRestored(true);
    };

    init();
  }, [fromSuccess, appointmentIdFromUrl, setPackageIDs, setSelectedProviderID, setSelectedServiceID, isMultiMode, setNotes]);

  useEffect(() => {
    if (!providerId) return;
    if (fromSuccess && !successSnapshotRestored) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const salonResponse = await ServiceProvider.getById(providerId);
        setSalon(salonResponse);

        const servicesResponse = await ServiceProvider.getServicesItems(providerId);
        
        if (isMultiMode) {
          const selectedServiceIds = multiBookingItems.map(item => item.serviceId);
          const filteredServices = servicesResponse.filter(s => 
            selectedServiceIds.includes(s.id)
          );
          setServices(filteredServices);
        } else {
          const filteredServices = servicesResponse.filter(s => 
            s.id === selectedServiceID
          );
          setServices(filteredServices);
        }

        if (getToken()) {
          CheckFavorite(providerId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromSuccess, successSnapshotRestored, providerId, isMultiMode, selectedServiceID, multiBookingItems]);

  const servicesSubtotal = services.reduce((sum, s) => sum + s.price, 0);
  const orderPackages: { id: string; name: string; price: number }[] =
    Array.isArray(providerPackages) && isPackageMode
      ? providerPackages
          .filter((p: { id?: string }) => packageIDs.includes(String(p.id)))
          .map((p: { id?: string; name?: string; price?: number }) => ({
            id: String(p.id ?? ""),
            name: p.name ?? "",
            price: Number(p.price) || 0,
          }))
      : [];
  const packagesSubtotal = orderPackages.reduce((sum: number, p) => sum + p.price, 0);
  const subtotal = servicesSubtotal + packagesSubtotal;
  const totalPrice = fromSuccess && serverTotal !== null ? serverTotal : subtotal - couponDiscount;
  const displayDiscount = fromSuccess && serverTotal !== null ? (subtotal - serverTotal) : couponDiscount;

  const order: BookingOrderDetails = {
    services: services.map((s) => ({ id: s.id, name: s.name, price: s.price })),
    packages: orderPackages.length ? orderPackages : undefined,
    subtotal,
    tax: 0,
    discount: displayDiscount,
    totalPrice,
    totalDuration: services.reduce((sum, s) => sum + (s.duration || 0), 0),
  };

  const handleApplyCoupon = async (code: string) => {
    if (!code) {
      toast.error(t("bookingDetails.orderDetails.couponRequired"));
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (getUsedCouponCodes().includes(normalizedCode)) {
      toast.error(t("bookingDetails.orderDetails.couponAlreadyUsed"));
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error(t("bookingDetails.orderDetails.loginRequired"));
        return;
      }

      if (!providerId) {
        toast.error(t("bookingDetails.orderDetails.providerRequired"));
        return;
      }

      const coupon = await CouponService.getCouponByCode(token, code, providerId);

      if (coupon.status !== "ACTIVE" && coupon.status !== "PARTIAL_USED") {
        toast.error(t("bookingDetails.orderDetails.couponInactive"));
        return;
      }

      if (new Date(coupon.expiredAt) < new Date()) {
        toast.error(t("bookingDetails.orderDetails.couponExpired"));
        return;
      }

      const remaining = coupon.remaining ?? coupon.totalPrice;
      const discount = Math.min(remaining, subtotal);

      setCouponDiscount(discount);
      setAppliedCouponCode(code);
      sessionStorage.setItem("appliedCouponCode", code);
      sessionStorage.setItem("appliedCouponDiscount", discount.toString());
      openCouponModal();
    } catch (error: any) {
      console.error("Apply coupon error:", error);
      const status = error?.response?.status;
      
      // 404 = coupon not found
      if (status === 404) {
        toast.error(t("bookingDetails.orderDetails.couponInvalid"));
      } else {
        // Use user-friendly error message for other errors
        const friendlyMessage = getUserFriendlyErrorMessage(error, { isRTL });
        toast.error(friendlyMessage);
      }
    }
  };

  const goToPay = () => {
    setIsNavigating(true);
    if (isMultiMode) {
      router.push("/payment-details?mode=multi");
    } else if (isPackageMode) {
      router.push("/payment-details?mode=package");
    } else {
      router.push("/payment-details");
    }
  };

  if (loading) return <div>{t("loading")}</div>;
  if (!salon) return <div>{t("salonDetails.notFound")}</div>;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-5">
      <SalonDetailsCard 
        salon={salon} 
        inputLabel={inputLabel || salon?.category || ""} 
        showTitle={true} 
        isFavorited={isSalonFavorite}
        onFavoriteClick={toggleFavorite}
      />
      <BookingOrderDetailsCard 
        order={order} 
        onApplyCoupon={handleApplyCoupon} 
        hideCouponInput={hideGoToPay} 
      />
      {(!hideGoToPay || (notes && notes.trim() !== "")) && (
        <NotesCard value={notes} onChange={setNotes} readOnly={hideGoToPay} />
      )}
      {!hideGoToPay && (
        <BookNow
          btnName={isNavigating ? t("loading") : t("serviceDetails.goToPay")}
          disabled={isNavigating}
          className="mx-auto w-auto min-w-[10rem]"
          onClick={goToPay}
        />
      )}

      {/* Coupon Success Modal */}
      <CustomDialog open={couponModalOpen}>
        <div className="text-center p-6" dir={isRTL ? "rtl" : "ltr"}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("bookingDetails.orderDetails.couponApplied")}
          </h3>

          <div className="bg-[#79A66B]/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-gray-600">{t("couponCode")}:</span>
              <span className="text-lg font-bold text-[#79A66B]">{appliedCouponCode}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">{t("bookingDetails.orderDetails.discount")}:</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-green-600">{couponDiscount}</span>
                <span className="text-sm text-gray-600">{t("sar")}</span>
              </div>
            </div>
          </div>

          <button
            onClick={closeCouponModal}
            className="w-full px-6 py-3 bg-[#79A66B] text-white rounded-lg font-semibold hover:bg-[#79A66B]/90 transition-colors"
          >
            {t("ok")}
          </button>
        </div>
      </CustomDialog>
    </div>
  );
}
