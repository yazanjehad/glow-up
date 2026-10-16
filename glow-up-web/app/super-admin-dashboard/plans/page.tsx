"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Filter,
  Pencil,
  Trash2,
  Percent,
  Clock,
  Users,
  CreditCard,
  Calendar,
  SaudiRiyal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { subscriptionsService } from "@/integration/services/subscriptions/subscriptions.service";
import { Plan, PlanType } from "@/integration/services/subscriptions/subscriptions.types";
import { hasPermission, PermissionType, isSuperAdmin } from "@/lib/auth/permissions";
import { NoPermission } from "@/components/auth/NoPermission";
import PlanFormDialog from "@/components/admin/plans/PlanFormDialog";
import SubscribeProviderDialog from "@/components/admin/plans/SubscribeProviderDialog";

export default function PlansManagementPage() {
  const { i18n } = useTranslation();
  const isRTL = (i18n.language || "").toLowerCase().startsWith("ar");

  // Permission checks
  const isAdmin = isSuperAdmin();
  const canManagePlans = isAdmin || hasPermission([PermissionType.PLAN_MANAGE]);
  const canManageSubscriptions = isAdmin || hasPermission([PermissionType.SUBSCRIPTION_MANAGE]);
  const canAccessPage = canManagePlans || canManageSubscriptions;

  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [success, setSuccess] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState<Plan | null>(null);

  // Client-side filtered plans based on typeFilter
  const filteredPlans = useMemo(() => {
    if (typeFilter === "all") return allPlans;
    return allPlans.filter(plan => plan.type === typeFilter);
  }, [allPlans, typeFilter]);

  const fetchPlans = useCallback(async () => {
    if (!canAccessPage) return;
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setForbidden(false);
      // Send filter to API as well
      const filterType = typeFilter === "all" ? undefined : typeFilter;
      const data = await subscriptionsService.getPlans(filterType);
      setAllPlans(data);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setForbidden(true);
      } else {
        setError(e?.response?.data?.message || e?.message || "Failed to load plans");
      }
    } finally {
      setLoading(false);
    }
  }, [canAccessPage, typeFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (!canAccessPage) {
    return <NoPermission />;
  }

  const handleToggleActive = async (plan: Plan) => {
    try {
      await subscriptionsService.updatePlan(plan._id, { isActive: !plan.isActive });
      setAllPlans((prev: Plan[]) =>
        prev.map((p: Plan) => (p._id === plan._id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update plan status");
    }
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;
    try {
      setError("");
      const apiMessage = await subscriptionsService.deletePlan(deletingPlan._id);
      setAllPlans((prev: Plan[]) => prev.filter((p: Plan) => p._id !== deletingPlan._id));
      setDeletingPlan(null);
      const lower = (apiMessage || "").toLowerCase();
      const successMsg = lower.includes("deactiv") || lower.includes("inactive")
        ? isRTL
          ? "تم إلغاء تفعيل الخطة بنجاح"
          : "Plan deactivated successfully"
        : apiMessage || (isRTL ? "تم إلغاء تفعيل الخطة بنجاح" : "Plan deactivated successfully");
      setSuccess(successMsg);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete plan");
      setSuccess("");
    }
  };

  const handlePlanSaved = () => {
    fetchPlans();
    setIsCreateDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSubscribeClick = (plan: Plan) => {
    setSubscribingPlan(plan);
    setIsSubscribeDialogOpen(true);
  };

  const canSubscribe = hasPermission([PermissionType.SUBSCRIPTION_MANAGE]);

  const getPlanIcon = (type: PlanType) => {
    return type === "PERCENT" ? (
      <Percent className="h-5 w-5" />
    ) : (
      <Clock className="h-5 w-5" />
    );
  };

  const getPlanTypeLabel = (type: PlanType) => {
    if (type === "PERCENT") {
      return isRTL ? "خطة عمولة" : "Commission Based";
    }
    return isRTL ? "خطة زمنية" : "Duration Based";
  };

  const getPlanTypeColor = (type: PlanType) => {
    return type === "PERCENT"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if list should show NoPermission
  const showListNoPermission = !canManagePlans || forbidden;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="mb-8 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900 tracking-tight">
              {isRTL ? "إدارة الخطط" : "Plans Management"}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {isRTL
                ? "إنشاء وإدارة خطط الاشتراك للمزودين"
                : "Create and manage subscription plans for providers"}
            </p>
          </div>
          {canManagePlans && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              {isRTL ? "إنشاء خطة" : "Create Plan"}
            </Button>
          )}
        </div>
      </header>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          {isRTL ? "تصفية حسب النوع:" : "Filter by type:"}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
            <SelectItem value="PERCENT">
              {isRTL ? "نسبة عمولة" : "Percentage"}
            </SelectItem>
            <SelectItem value="DAYS">{isRTL ? "مدة زمنية" : "Duration"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
      {/* Success */}
      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-4">
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      {/* Content */}
      {showListNoPermission ? (
        <NoPermission type="plans" />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isRTL ? "لا توجد خطط" : "No Plans"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isRTL
              ? "قم بإنشاء خطتك الأولى للبدء"
              : "Create your first plan to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 me-2" />
            {isRTL ? "إنشاء خطة" : "Create Plan"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan: Plan) => (
            <Card
              key={plan._id}
              className={`relative transition-all hover:shadow-md flex flex-col h-full ${
                !plan.isActive ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        plan.type === "PERCENT"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {getPlanIcon(plan.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {plan.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-xs ${getPlanTypeColor(plan.type)}`}
                      >
                        {getPlanTypeLabel(plan.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={() => handleToggleActive(plan)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  {plan.type === "PERCENT" ? (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        {isRTL ? "نسبة العمولة" : "Commission"}
                      </span>
                      <span className="font-semibold text-purple-600">
                        {plan.commissionPercent}%
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {isRTL ? "السعر" : "Price"}
                        </span>
                        <span className="font-semibold text-green-600 inline-flex items-center gap-1">
                          {plan.price}
                          <SaudiRiyal className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {isRTL ? "المدة" : "Duration"}
                        </span>
                        <span className="font-semibold text-blue-600">
                          {plan.durationDays} {isRTL ? "يوم" : "days"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Created & Updated dates */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{isRTL ? "أنشئ:" : "Created:"}</span>
                    <span className="font-medium text-gray-700">{formatDate(plan.createdAt)}</span>
                  </div>
                  {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
                    <div className="flex items-center gap-1">
                      <span>{isRTL ? "تحديث:" : "Updated:"}</span>
                      <span className="font-medium text-gray-700">{formatDate(plan.updatedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Pencil className="h-3.5 w-3.5 me-1.5" />
                    {isRTL ? "تعديل" : "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSubscribeClick(plan)}
                    disabled={!plan.isActive || !canSubscribe}
                  >
                    <Users className="h-3.5 w-3.5 me-1.5" />
                    {isRTL ? "اشتراك" : "Subscribe"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeletingPlan(plan)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <PlanFormDialog
        open={isCreateDialogOpen || !!editingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingPlan(null);
          }
        }}
        plan={editingPlan}
        onSaved={handlePlanSaved}
      />

      {/* Subscribe Provider Dialog */}
      <SubscribeProviderDialog
        open={isSubscribeDialogOpen}
        onOpenChange={setIsSubscribeDialogOpen}
        plan={subscribingPlan}
        onSuccess={() => {
          setIsSubscribeDialogOpen(false);
          setSubscribingPlan(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "تأكيد الحذف" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `هل أنت متأكد من حذف الخطة "${deletingPlan?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deletingPlan?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRTL ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
