"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Search,
  Calendar,
  Star,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  Mail,
  Phone,
  Filter,
  RefreshCw,
} from "lucide-react";

import {
  customersService,
  Customer,
} from "@/integration/services/admin/customers.service";
import PaginationBar from "@/components/pagination/pagination";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const CustomersPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewCustomers =
    isAdmin || hasPermission([PermissionType.VIEW_CUSTOMERS]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);

  // Filters
  const [minBookings, setMinBookings] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number | "">("");

  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!canViewCustomers) return;
    setLoading(true);
    setError("");
    try {
      const response = await customersService.list({
        page: currentPage,
        limit,
        minBookings: minBookings !== "" ? minBookings : undefined,
        minRating: minRating !== "" ? minRating : undefined,
      });

      setCustomers(response.data || []);
      setTotalCount(response.total || 0);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      if (err?.response?.status === 403) {
        setForbidden(true);
      } else {
        setError(err?.message || "Failed to load customers");
      }
    } finally {
      setLoading(false);
    }
  }, [canViewCustomers, currentPage, limit, minBookings, minRating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleStatusToggle = async (customer: Customer) => {
    const newStatus = customer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await customersService.updateStatus(customer.id, newStatus);
      fetchCustomers();
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteCode) return;
    setIsDeleting(true);
    try {
      await customersService.deleteAccount(deleteId, deleteCode, deleteReason);
      setDeleteId(null);
      setDeleteCode("");
      setDeleteReason("");
      fetchCustomers();
    } catch (err: any) {
      alert(err?.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canViewCustomers) return <NoPermission />;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="p-4 md:p-8 min-h-screen bg-[#F8FAFC]"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRTL ? "إدارة العملاء" : "Customers Management"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isRTL
                ? "عرض وإدارة حسابات العملاء والحجوزات"
                : "View and manage customer accounts and bookings"}
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-slate-900 font-bold pr-4 border-e border-slate-100">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>{isRTL ? "الفلاتر" : "Filters"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 flex-1">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {isRTL ? "الحد الأدنى للحجوزات" : "Min Bookings"}
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minBookings}
                  onChange={(e) => setMinBookings(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl w-24 h-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {isRTL ? "الحد الأدنى للتقييم" : "Min Rating"}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  max="5"
                  placeholder="0.0"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl w-24 h-9"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-slate-400 hover:text-red-600 font-bold text-xs"
                onClick={() => {
                  setMinBookings("");
                  setMinRating("");
                }}
              >
                {isRTL ? "إعادة تعيين" : "Reset Filters"}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {forbidden ? (
              <NoPermission type="general" />
            ) : loading && customers.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <RefreshCw className="animate-spin w-8 h-8 text-emerald-600" />
                <p className="text-slate-500 font-medium">{t("commonD.loading")}</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isRTL ? "لا يوجد عملاء" : "No customers found"}
                </h3>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full text-start border-separate border-spacing-0 min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-tight text-start whitespace-nowrap w-[25%]">
                          {isRTL ? "العميل" : "Customer"}
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-tight text-center whitespace-nowrap">
                          {isRTL ? "الحجوزات" : "Bookings"}
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-tight text-center whitespace-nowrap">
                          {isRTL ? "التقييم" : "Rating"}
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-tight text-center whitespace-nowrap">
                          {isRTL ? "الحالة" : "Status"}
                        </th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-tight text-center whitespace-nowrap">
                          {isRTL ? "إجراءات" : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold border border-indigo-100 text-xs">
                                {customer.firstName?.charAt(0) || "C"}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <div className="text-sm font-bold text-slate-900 truncate" title={`${customer.firstName} ${customer.lastName}`}>
                                  {customer.firstName} {customer.lastName}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{customer.phone}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-bold text-slate-700">{customer.totalBookings || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-fit">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-black text-amber-700">{customer.avgRating || 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${customer.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                                }`}
                            >
                              {customer.status === "ACTIVE" ? (isRTL ? "نشط" : "Active") : (isRTL ? "موقف" : "Suspended")}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full">
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="rounded-2xl border-slate-200">
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer font-bold text-xs"
                                  onClick={() => handleStatusToggle(customer)}
                                >
                                  {customer.status === "ACTIVE" ? (
                                    <>
                                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                                      <span>{isRTL ? "إيقاف الحساب" : "Suspend Account"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                      <span>{isRTL ? "تنشيط الحساب" : "Activate Account"}</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer font-bold text-xs text-red-600"
                                  onClick={() => setDeleteId(customer.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>{isRTL ? "حذف الحساب" : "Delete Account"}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                  <PaginationBar
                    page={currentPage}
                    totalPages={totalPages}
                    limit={limit}
                    isRTL={isRTL}
                    onPageChange={setCurrentPage}
                    onLimitChange={setLimit}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">
              {isRTL ? "هل أنت متأكد من حذف الحساب؟" : "Are you sure you want to delete this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <p className="text-sm text-slate-500">
                {isRTL
                  ? "هذا الإجراء سيقوم بحذف حساب العميل نهائياً. يرجى إدخال كود التأكيد للمتابعة."
                  : "This action will permanently delete the customer account. Please enter the confirmation code to proceed."}
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isRTL ? "كود التأكيد" : "Confirmation Code"}
                </label>
                <Input
                  placeholder="1234"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isRTL ? "السبب (اختياري)" : "Reason (Optional)"}
                </label>
                <Input
                  placeholder={isRTL ? "اكتب السبب هنا..." : "Write reason here..."}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="rounded-xl font-bold flex-1">
              {isRTL ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 rounded-xl font-bold flex-1"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!deleteCode || isDeleting}
            >
              {isDeleting ? (isRTL ? "جاري الحذف..." : "Deleting...") : (isRTL ? "حذف نهائي" : "Delete Permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomersPage;
