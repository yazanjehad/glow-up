"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Shield, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminUsersService,
  AdminUser,
  CreateAdminUserPayload,
} from "@/integration/services/admin/adminUsers.service";
import {
  PermissionType as LocalPermissionType,
  PermissionType,
  hasPermission,
  isSuperAdmin,
} from "@/lib/auth/permissions";
import { NoPermission } from "@/components/auth/NoPermission";
import PaginationBar from "@/components/pagination/pagination";

// Exclude USER_MANAGE from assignable permissions - only super admin can manage users
const ALL_PERMISSIONS: LocalPermissionType[] = Object.values(
  LocalPermissionType,
).filter((p) => p !== LocalPermissionType.USER_MANAGE);

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canManageUsers = isAdmin || hasPermission([PermissionType.USER_MANAGE]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) return;
    try {
      setLoading(true);
      setError("");
      setForbidden(false);
      const response = await adminUsersService.list(page, limit);
      setUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (e: unknown) {
      console.error("Failed to load users", e);
      const status = (e as { response?: { status?: number } })?.response
        ?.status;
      const serverMessage = (
        e as {
          response?: { data?: { message?: string } };
        }
      )?.response?.data?.message;
      if (status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      let messageKey = "adminUsers.errors.loadFailed";
      if (status === 401) messageKey = "adminUsers.errors.unauthorized";
      else if (status && status >= 500)
        messageKey = "adminUsers.errors.serverError";
      else if (typeof serverMessage === "string" && serverMessage.trim()) {
        setError(serverMessage.trim());
        setUsers([]);
        setLoading(false);
        return;
      }
      setError(t(messageKey));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, t, canManageUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!canManageUsers) {
    return <NoPermission />;
  }

  const openPermissionsModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleUserCreated = () => {
    setShowAddModal(false);
    loadUsers();
  };

  const handlePermissionsUpdated = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const showListNoPermission = forbidden;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
            {t("adminUsers.title")}
          </h2>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
            {t("adminUsers.subtitle")}
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="flex w-full sm:w-auto items-center justify-center gap-2 bg-[#79a66b] hover:bg-[#6a9460] text-white"
        >
          <Plus size={18} />
          {t("adminUsers.addUser")}
        </Button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
        {showListNoPermission ? (
          <NoPermission type="users" />
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("adminUsers.noUsers")}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.name")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.phone")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.role")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.status")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.permissions")}
                    </th>
                    <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("adminUsers.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#e2ecdf] flex items-center justify-center shrink-0">
                            <User size={20} className="text-[#79a66b]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 break-words">
                              {user.name}
                            </p>
                            {user.email && (
                              <p className="text-xs text-gray-500 break-all">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.status === "ACTIVE"
                            ? t("adminUsers.status.active")
                            : t("adminUsers.status.inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.permissions.length > 0
                          ? `${user.permissions.length} ${t("adminUsers.permissionsCount")}`
                          : t("adminUsers.noPermissions")}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPermissionsModal(user)}
                          className="flex items-center gap-1"
                        >
                          <Shield size={14} />
                          {t("adminUsers.managePermissions")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#e2ecdf] flex items-center justify-center shrink-0">
                        <User size={20} className="text-[#79a66b]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 break-words">
                          {user.name}
                        </h3>
                        {user.email && (
                          <p className="text-xs text-gray-500 mt-1 break-all">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissionsModal(user)}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <Shield size={14} />
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-medium text-gray-400 mb-1">
                        {t("adminUsers.table.phone")}
                      </p>
                      <p className="text-sm text-gray-700 break-words">
                        {user.phone}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("adminUsers.table.role")}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-medium text-gray-400 mb-1">
                          {t("adminUsers.table.status")}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.status === "ACTIVE"
                            ? t("adminUsers.status.active")
                            : t("adminUsers.status.inactive")}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                      <p className="text-[11px] font-medium text-gray-400 mb-1">
                        {t("adminUsers.table.permissions")}
                      </p>
                      <p className="text-sm text-gray-700 break-words">
                        {user.permissions.length > 0
                          ? `${user.permissions.length} ${t("adminUsers.permissionsCount")}`
                          : t("adminUsers.noPermissions")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-sm text-gray-500">
                    {t("adminUsers.pagination.showing", {
                      from: (page - 1) * limit + 1,
                      to: Math.min(page * limit, total),
                      total,
                    })}
                  </p>

                  <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    limit={limit}
                    isRTL={isRTL}
                    disabled={loading}
                    onPageChange={(p) => setPage(p)}
                    onLimitChange={() => {}}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handlePermissionsUpdated}
        />
      )}
    </div>
  );
}

function AddUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [form, setForm] = useState<CreateAdminUserPayload>({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(t("adminUsers.validation.nameRequired"));
      return;
    }
    const phone = form.phone.trim();
    if (!phone) {
      setError(t("adminUsers.validation.phoneRequired"));
      return;
    }
    if (phone.length !== 10) {
      setError(t("adminUsers.validation.phoneLength"));
      return;
    }
    if (!phone.startsWith("05")) {
      setError(t("adminUsers.validation.phoneStart"));
      return;
    }
    if (!/^\d+$/.test(phone)) {
      setError(t("adminUsers.validation.phoneDigits"));
      return;
    }

    if (!form.email?.trim()) {
      setError(t("adminUsers.validation.emailRequired"));
      return;
    }

    try {
      setSaving(true);
      setError("");
      await adminUsersService.create(form);
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("adminUsers.errors.createFailed");
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-[20px] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {t("adminUsers.addUserModal.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 break-words">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminUsers.fields.name")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("adminUsers.placeholders.name")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminUsers.fields.phone")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm((f) => ({ ...f, phone: raw }));
              }}
              placeholder={t("adminUsers.placeholders.phone")}
              dir="ltr"
            />
            {form.phone.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {form.phone.length}/10
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminUsers.fields.email")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t("adminUsers.placeholders.email")}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("adminUsers.fields.note")}
            </label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder={t("adminUsers.placeholders.note")}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#79a66b] hover:bg-[#6a9460] text-white"
            >
              {saving ? t("loading") : t("adminUsers.addUserModal.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [selectedPermissions, setSelectedPermissions] = useState<
    PermissionType[]
  >(user.permissions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = (permission: PermissionType) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      await adminUsersService.updatePermissions(user._id, selectedPermissions);
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("adminUsers.errors.updateFailed");
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-[20px] w-full max-w-lg max-h-[90vh] mx-4 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t("adminUsers.permissionsModal.title")}
            </h3>
            <p className="text-sm text-gray-500 mt-1 break-words">
              {user.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 break-words">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {ALL_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission)}
                  onChange={() => togglePermission(permission)}
                  className="w-4 h-4 text-[#79a66b] border-gray-300 rounded focus:ring-[#79a66b] mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {t(`adminUsers.permissions.${permission}`)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#79a66b] hover:bg-[#6a9460] text-white"
          >
            {saving ? t("loading") : t("adminUsers.permissionsModal.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
