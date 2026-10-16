"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Star, Trash2, Building2, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ratingsService, Rating } from "@/integration/services/admin/ratings.service";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { NoPermission } from "@/components/auth/NoPermission";
import PaginationBar from "@/components/pagination/pagination";
import { hasPermission, PermissionType, isSuperAdmin } from "@/lib/auth/permissions";

interface ProviderOption {
  id: string;
  name: string;
}

export default function RatingsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewRatings = isAdmin || hasPermission([PermissionType.VIEW_RATINGS]);
  const canDeleteRating = isAdmin || hasPermission([PermissionType.DELETE_RATING]);

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

const loadProviders = useCallback(async () => {
  if (!canViewRatings) return;
  try {
    const response = await ServiceProvider.getAllWithStatus({ 
      limit: 100, 
      status: "APPROVED" 
    });
    
    const providerList = (response?.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
    }));
    
    setProviders(providerList);
    
    if (providerList.length > 0 && selectedProvider === "all") {
      setSelectedProvider(providerList[0].id);
    }
  } catch (e) {
    console.error("Failed to load providers", e);
  }
}, [canViewRatings, selectedProvider]);
  const loadRatings = useCallback(async () => {
    if (!canViewRatings) return;
    try {
      setLoading(true);
      setError("");
      setForbidden(false);
      const providerId = selectedProvider !== "all" ? selectedProvider : undefined;
      const response = await ratingsService.list(providerId, currentPage, limit);
      setRatings(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (e: any) {
      console.error("Failed to load ratings", e);
      if (e?.response?.status === 403) {
        setForbidden(true);
      } else {
        setError(e?.message || (isRTL ? "فشل في تحميل التقييمات" : "Failed to load ratings"));
      }
      setRatings([]);
    } finally {
      setLoading(false);
    }
  }, [canViewRatings, selectedProvider, currentPage, limit, isRTL]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  if (!canViewRatings) {
    return <NoPermission />;
  }

  const handleDelete = async () => {
    if (!deletingRating) return;
    try {
      setDeleteLoading(true);
      setError("");
      setSuccess("");
      await ratingsService.delete(deletingRating.id);
      setSuccess(isRTL ? "تم حذف التقييم بنجاح" : "Rating deleted successfully");
      setDeletingRating(null);
      loadRatings();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || (isRTL ? "فشل في حذف التقييم" : "Failed to delete rating"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getProviderName = (provider: Rating["provider"]) => {
    return provider?.name || "N/A";
  };

  const getCustomerName = (customer: Rating["customer"]) => {
    return customer?.name || "N/A";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6 animate-in fade-in duration-500">
      <header className="mb-8 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">
              {isRTL ? "التقييمات" : "Ratings"}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {isRTL ? "عرض وإدارة تقييمات العملاء" : "View and manage customer ratings"}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={isRTL ? "اختر مزود الخدمة" : "Select Provider"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع المزودين" : "All Providers"}</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
        {forbidden ? (
          <NoPermission type="general" />
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : ratings.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? "لا توجد تقييمات" : "No Ratings"}
            </h3>
            <p className="text-sm text-gray-500">
              {isRTL ? "لم يتم العثور على تقييمات" : "No ratings found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ratings.map((rating) => (
              <div key={rating.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4">
                      {renderStars(rating.rating)}
                      <span className="text-sm font-medium text-gray-700">
                        {rating.rating}/5
                      </span>
                    </div>
                    
                    {rating.comment && (
                      <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-600">{rating.comment}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{getCustomerName(rating.customer)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{getProviderName(rating.provider)}</span>
                      </div>
                      {rating.createdAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(rating.createdAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                        </span>
                      )}
                    </div>
                  </div>

                  {canDeleteRating && !rating.isDeleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingRating(rating)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  {rating.isDeleted && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {isRTL ? "محذوف" : "Deleted"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingRating} onOpenChange={() => setDeletingRating(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader className={isRTL ? "sm:text-right text-right" : "sm:text-left text-left"}>
            <AlertDialogTitle>
              {isRTL ? "تأكيد الحذف" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "text-right" : "text-left"}>
              {isRTL
                ? "هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this rating? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleteLoading}>
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteLoading ? (isRTL ? "جاري الحذف..." : "Deleting...") : (isRTL ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {!loading && !forbidden && ratings.length > 0 && (
        <div className="mt-6">
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            limit={limit}
            isRTL={isRTL}
            onPageChange={setCurrentPage}
            onLimitChange={setLimit}
          />
        </div>
      )}
    </div>
  );
}
