"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Users, Search, Building2, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  employeesService,
  Employee,
} from "@/integration/services/admin/employees.service";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { NoPermission } from "@/components/auth/NoPermission";
import PaginationBar from "@/components/pagination/pagination";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import { Plus, X } from "lucide-react";
import { employeesServices } from "@/integration/services/employees/employees.service";
import { useLookupsStore } from "@/store/lookupsStore";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";
import { toast } from "sonner";

interface ProviderOption {
  id: string;
  name: string;
}

const API_BASE_URL = "https://api-staging.theglowhub.com.sa";

export default function EmployeesPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewEmployees =
    isAdmin || hasPermission([PermissionType.VIEW_EMPLOYEES]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    salonId: "",
    phone: "",
    gender: "FEMALE" as "MALE" | "FEMALE",
    positionId: "",
  });

  const { items: lookupItems, loadAll: loadLookups } = useLookupsStore();
  const positions = lookupItems.filter(
    (item) => item.key === "EMPLOYEE_POSITION" && item.isActive !== false
  );

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const handleAddEmployee = async () => {
    if (!addForm.salonId || !addForm.name || !addForm.positionId || !addForm.phone) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    if (!addForm.phone.startsWith("05") || addForm.phone.length !== 10) {
      toast.error(isRTL ? "رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" : "Phone must start with 05 and be 10 digits");
      return;
    }

    try {
      setIsSubmitting(true);
      await employeesServices.create(
        addForm.salonId,
        {
          name: addForm.name,
          positionId: addForm.positionId,
          phone: addForm.phone,
          gender: addForm.gender,
          email: "", // Optional
        } as any,
        "BOTH" // Default workFor
      );
      toast.success(isRTL ? "تم إضافة الموظف بنجاح" : "Employee added successfully");
      setIsAddModalOpen(false);
      setAddForm({ name: "", salonId: "", phone: "", gender: "FEMALE", positionId: "" });
      loadEmployees();
    } catch (error: any) {
      console.error("Failed to add employee:", error);
      toast.error(error?.message || (isRTL ? "فشل في إضافة الموظف" : "Failed to add employee"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadProviders = useCallback(async (searchQuery?: string) => {
    if (!canViewEmployees) return;
    try {
      const params: any = {};
      if (searchQuery) {
        params.name = searchQuery;
      }
      const response = await ServiceProvider.getAllWithStatus(params);
      const providerList = (response?.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
      }));
      setProviders(providerList);
      // Removed auto-selection to allow showing the "Please select a salon" message on initial load
    } catch (e) {
      console.error("Failed to load providers", e);
    }
  }, [canViewEmployees]);

  const loadEmployees = useCallback(async () => {
    if (!canViewEmployees) return;
    if (!selectedProvider || selectedProvider === "all") {
      setEmployees([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      setForbidden(false);
      const response = await employeesService.list(
        selectedProvider,
        currentPage,
        limit,
      );
      setEmployees(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (e: any) {
      console.error("Failed to load employees", e);
      if (e?.response?.status === 404) {
        setEmployees([]);
        setTotalPages(1);
      } else if (e?.response?.status === 403) {
        setForbidden(true);
      } else {
        setError(
          e?.message ||
          (isRTL ? "فشل في تحميل الموظفين" : "Failed to load employees"),
        );
      }
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [canViewEmployees, selectedProvider, currentPage, limit, isRTL]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Debounced provider search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProviders(providerSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [providerSearchTerm, loadProviders]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.provider-dropdown-container')) {
        setShowProviderDropdown(false);
      }
    };

    if (showProviderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProviderDropdown]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  if (!canViewEmployees) {
    return <NoPermission />;
  }

  const buildFileUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    return `${API_BASE_URL}/files/public?path=${encodeURIComponent(clean)}`;
  };

  const getProviderName = (providerId: Employee["providerId"]) => {
    if (typeof providerId === "object" && providerId?.name) {
      return providerId.name;
    }
    const provider = providers.find((p) => p.id === providerId);
    if (provider?.name) return provider.name;

    // Fallback to providerSearchTerm if it matches the ID or if we just selected it
    if (selectedProvider === providerId && providerSearchTerm && !providerSearchTerm.includes("69e")) {
      return providerSearchTerm;
    }

    return typeof providerId === "string" && providerId.length > 20 ? (isRTL ? "جاري التحميل..." : "Loading...") : (typeof providerId === "string" ? providerId : "N/A");
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="p-4 sm:p-6 animate-in fade-in duration-500"
    >
      <header className="mb-6 sm:mb-8 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-semibold text-gray-900 tracking-tight">
              {isRTL ? "الموظفون" : "Employees"}
              {selectedProvider !== "all" && (
                <span className="text-primary mx-2">
                  - {getProviderName(selectedProvider)}
                </span>
              )}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
              {isRTL
                ? "عرض وإدارة موظفي مقدمي الخدمات"
                : "View and manage service provider employees"}
            </p>
          </div>
          <button
            onClick={() => {
              setAddForm(prev => ({
                ...prev,
                salonId: selectedProvider !== "all" ? selectedProvider : ""
              }));
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {isRTL ? "إضافة موظف" : "Add Employee"}
            </span>
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {/* 1. Salon Search First */}
        <div className="relative w-full lg:w-[300px] provider-dropdown-container">
          <Building2 className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10`} />
          <Input
            placeholder={isRTL ? "ابحث عن مزود الخدمة..." : "Search provider..."}
            value={providerSearchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setProviderSearchTerm(val);
              setShowProviderDropdown(true);
              if (!val.trim()) {
                setSelectedProvider("all");
                setEmployees([]);
                setSearchTerm("");
              }
            }}
            onFocus={() => setShowProviderDropdown(true)}
            className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
          {showProviderDropdown && providerSearchTerm && providers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setProviderSearchTerm(provider.name);
                    setShowProviderDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${selectedProvider === provider.id ? "bg-gray-50 font-medium" : ""
                    }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Employee Search Second */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search
            className={`absolute ${isRTL ? "right-3" : "left-3"
              } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
          />
          <Input
            placeholder={
              isRTL
                ? "بحث بالاسم، البريد أو الهاتف..."
                : "Search by name, email or phone..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedProvider || selectedProvider === "all"}
            className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} w-full ${(!selectedProvider || selectedProvider === "all") ? "opacity-50 cursor-not-allowed" : ""
              }`}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
        {forbidden ? (
          <NoPermission type="general" />
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? "لا توجد موظفين" : "No Employees"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isRTL ? "لم يتم العثور على موظفين" : "No employees found"}
            </p>
            {(!selectedProvider || selectedProvider === "all") && (
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/5 text-primary border border-primary/10">
                <span className="text-sm font-semibold">
                  {isRTL ? "الرجاء اختيار صالون" : "Please select a salon"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? "الموظف" : "Employee"}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? "البريد الإلكتروني" : "Email"}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? "الهاتف" : "Phone"}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? "مزود الخدمة" : "Provider"}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                            {employee.profileImage || employee.avatar ? (
                              <Image
                                src={buildFileUrl(employee.profileImage || employee.avatar)}
                                alt={employee.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              employee.name?.charAt(0) || "?"
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {employee.name}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {getProviderName(employee.providerId)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="break-all">
                            {employee.email || "---"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{employee.phone || "---"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 break-words">
                          {getProviderName(employee.providerId)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${employee.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${employee.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                          />
                          {employee.isActive
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                              ? "غير نشط"
                              : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                        {employee.profileImage || employee.avatar ? (
                          <Image
                            src={buildFileUrl(employee.profileImage || employee.avatar)}
                            alt={employee.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          employee.name?.charAt(0) || "?"
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 break-words">
                          {employee.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 break-words">
                          {getProviderName(employee.providerId)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${employee.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${employee.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                      />
                      {employee.isActive
                        ? isRTL
                          ? "نشط"
                          : "Active"
                        : isRTL
                          ? "غير نشط"
                          : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-gray-400 mb-1">
                        {isRTL ? "البريد الإلكتروني" : "Email"}
                      </p>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="break-all">
                          {employee.email || "---"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-gray-400 mb-1">
                        {isRTL ? "الهاتف" : "Phone"}
                      </p>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="break-words">
                          {employee.phone || "---"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-gray-400 mb-1">
                        {isRTL ? "مزود الخدمة" : "Provider"}
                      </p>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="break-words">
                          {getProviderName(employee.providerId)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!loading && !forbidden && employees.length > 0 && (
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

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {isRTL ? "إضافة موظف جديد" : "Add New Employee"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 1. Salon Selection First */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">
                  {isRTL ? "الصالون / المزود" : "Salon / Provider"}
                </label>
                <select
                  value={addForm.salonId}
                  onChange={(e) => setAddForm({ ...addForm, salonId: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white"
                >
                  <option value="">{isRTL ? "اختر صالون..." : "Select salon..."}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Employee Name - Disabled until salon selected */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">
                  {isRTL ? "اسم الموظف" : "Employee Name"}
                </label>
                <Input
                  placeholder={isRTL ? "أدخل اسم الموظف..." : "Enter employee name..."}
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  disabled={!addForm.salonId}
                  className={`h-11 rounded-xl ${!addForm.salonId ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                />
                {!addForm.salonId && (
                  <p className="text-[10px] text-amber-600 mt-1 px-1 font-medium">
                    {isRTL ? "يجب اختيار صالون أولاً" : "Must select a salon first"}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">
                  {isRTL ? "رقم الهاتف" : "Phone Number"}
                </label>
                <Input
                  placeholder="05xxxxxxxx"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="h-11 rounded-xl"
                  inputMode="numeric"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">
                    {isRTL ? "الجنس" : "Gender"}
                  </label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white"
                  >
                    <option value="FEMALE">{isRTL ? "أنثى" : "Female"}</option>
                    <option value="MALE">{isRTL ? "ذكر" : "Male"}</option>
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">
                    {isRTL ? "المنصب" : "Position"}
                  </label>
                  <select
                    value={addForm.positionId}
                    onChange={(e) => setAddForm({ ...addForm, positionId: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white"
                  >
                    <option value="">{isRTL ? "اختر..." : "Select..."}</option>
                    {positions.map(pos => (
                      <option key={pos._id} value={pos._id}>
                        {pickLocalized(pos.name, isRTL ? "ar" : "en")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-white transition-colors text-sm"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all text-sm"
              >
                {isSubmitting ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
