"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Pencil } from "lucide-react";
import { employeesService } from "@/integration/services/admin/employees.service";

import type {
  TeamMemberForm,
  TeamTab,
  RoleKey,
} from "@/app/models/provider-team-types";
import type { WorkingHoursSchedule, DayKey } from "@/store/providerStore";
import Switch from "@/components/provider-team/Switch";

import { useLookupsStore } from "@/store/lookupsStore";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";

const DEFAULT_WORKING_HOURS: WorkingHoursSchedule = {
  sunday: { open: false, from: "10:00", to: "18:00" },
  monday: { open: true, from: "10:00", to: "18:00" },
  tuesday: { open: true, from: "10:00", to: "18:00" },
  wednesday: { open: true, from: "10:00", to: "18:00" },
  thursday: { open: true, from: "10:00", to: "18:00" },
  friday: { open: true, from: "10:00", to: "18:00" },
  saturday: { open: false, from: "10:00", to: "18:00" },
};

type FormErrors = {
  name?: string;
  positionId?: string;
  phone?: string;
  gender?: string;
  workFor?: string;
};

export default function MemberModal({
  member,
  providerWorkingHours,
  saving = false,
  externalError = "",
  onClose,
  onSave,
}: {
  member: TeamMemberForm;
  providerWorkingHours?: WorkingHoursSchedule;
  saving?: boolean;
  externalError?: string;
  onClose: () => void;
  onSave: (m: TeamMemberForm, profileFile?: File) => void;
}) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = isRTL ? "ar" : "en";

  const [tab, setTab] = useState<TeamTab>("basic");
  const effectiveProviderHours = providerWorkingHours || DEFAULT_WORKING_HOURS;

  const [form, setForm] = useState<TeamMemberForm>({
    ...member,
    roles: { ...member.roles },
    workingHours: member.workingHours || { ...effectiveProviderHours },
    useCustomHours: member.useCustomHours ?? false,
  });

  const [profileFile, setProfileFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    setForm({
      ...member,
      roles: { ...member.roles },
      workingHours: member.workingHours || { ...effectiveProviderHours },
      useCustomHours: member.useCustomHours ?? false,
    });
    setProfileFile(undefined);
  }, [member, effectiveProviderHours]);

  const loadLookups = useLookupsStore((s) => s.loadAll);
  const lookupItems = useLookupsStore((s) => s.items);
  const lookupsLoading = useLookupsStore((s) => s.loading);
  const lookupsError = useLookupsStore((s) => s.error);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const positionOptions = useMemo(() => {
    return lookupItems.filter(
      (x) => x.key === "EMPLOYEE_POSITION" && x.isActive !== false,
    );
  }, [lookupItems]);

  const selectedPositionLabel = useMemo(() => {
    const obj = positionOptions.find((x) => x._id === form.positionId);
    return pickLocalized(obj?.name, lang) || "";
  }, [positionOptions, form.positionId, lang]);

  const [errors, setErrors] = useState<FormErrors>({});

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    form.avatarUrl || "",
  );
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  useEffect(() => {
    setAvatarPreview(form.avatarUrl || "");
    setAvatarPreviewError(false);
  }, [form.avatarUrl]);

  const showAvatarImage = !!avatarPreview && !avatarPreviewError;

  const isEdit = Boolean(member?.name?.trim());
  const title = useMemo(() => {
    return isEdit
      ? form.name?.trim() || t("provider.providerTeam.modal.addTitle")
      : t("provider.providerTeam.modal.addTitle");
  }, [isEdit, form.name, t]);

  const setField = <K extends keyof TeamMemberForm>(
    key: K,
    value: TeamMemberForm[K],
  ) => {
    setForm((p) => ({ ...p, [key]: value }));

    if (key === "name") {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
    if (key === "positionId" || key === "jobTitle") {
      setErrors((prev) => ({ ...prev, positionId: "" }));
    }
    if (key === "phone") {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const setRole = (key: RoleKey, value: boolean) => {
    setForm((p) => ({ ...p, roles: { ...p.roles, [key]: value } }));
  };

  const validateBasic = () => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("provider.providerTeam.validation.nameRequired");
    }

    if (!(form.positionId ?? "").trim() && !form.jobTitle.trim()) {
      nextErrors.positionId = t("provider.providerTeam.validation.jobRequired");
    }

    if (!form.gender) {
      nextErrors.gender = isRTL ? "يرجى تحديد الجنس" : "Gender is required";
    }

    if (!form.workFor) {
      nextErrors.workFor = isRTL ? "يرجى تحديد لمن يعمل" : "Work For is required";
    }

    return nextErrors;
  };

  const validateLogin = () => {
    const nextErrors: FormErrors = {};
    const phone = (form.phone ?? "").trim();

    if (!phone) {
      nextErrors.phone = isRTL
        ? "رقم الهاتف مطلوب"
        : "Phone number is required";
      return nextErrors;
    }

    if (!/^\d+$/.test(phone)) {
      nextErrors.phone = isRTL
        ? "رقم الهاتف يجب أن يحتوي على أرقام فقط"
        : "Phone number must contain digits only";
      return nextErrors;
    }

    if (!phone.startsWith("05")) {
      nextErrors.phone = isRTL
        ? "رقم الهاتف يجب أن يبدأ بـ 05"
        : "Phone number must start with 05";
      return nextErrors;
    }

    if (phone.length !== 10) {
      nextErrors.phone = isRTL
        ? "رقم الهاتف يجب أن يتكون من 10 أرقام"
        : "Phone number must be exactly 10 digits";
      return nextErrors;
    }

    return nextErrors;
  };

  const finalizeSave = () => {
    onSave(
      {
        ...form,
        positionLabel: selectedPositionLabel || form.positionLabel,
        jobTitle: selectedPositionLabel || form.jobTitle,
      },
      profileFile,
    );
  };

  const applyBasic = () => {
    const basicErrors = validateBasic();
    if (Object.keys(basicErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...basicErrors }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      name: "",
      positionId: "",
    }));
    setTab("login");
  };

  const saveAll = () => {
    const basicErrors = validateBasic();
    if (Object.keys(basicErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...basicErrors }));
      setTab("basic");
      return;
    }

    const loginErrors = validateLogin();
    if (Object.keys(loginErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...loginErrors }));
      setTab("login");
      return;
    }

    setErrors({});
    finalizeSave();
  };
  const [avatarError, setAvatarError] = useState<string>("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="w-full max-w-xl max-h-[100vh] overflow-hidden rounded-2xl bg-white p-5"
      >
        <div className="relative flex items-center justify-center">
          <div className="text-[15px] font-semibold text-gray-900">{title}</div>

          <button
            onClick={onClose}
            className="absolute left-0 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="close"
            type="button"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        <div className="mt-3 flex justify-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-100">
            {showAvatarImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="avatar"
                className="h-full w-full object-cover"
                onError={() => setAvatarPreviewError(true)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employeesService.getGenderIcon()}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-gray-200"
              title={t("provider.providerTeam.modal.editAvatar")}
            >
              <Pencil className="h-3.5 w-3.5 text-gray-700" />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.heic,.heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setAvatarError("");

                const allowedTypes = [
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "image/gif",
                  "image/svg+xml",
                ];

                if (!allowedTypes.includes(file.type)) {
                  setAvatarError(t("provider.providerTeam.errors.avatarInvalid"));
                  e.target.value = "";
                  return;
                }

                const maxSize = 2 * 1024 * 1024;
                if (file.size > maxSize) {
                  setAvatarError(t("provider.providerTeam.errors.avatarSize", { max: 2 }));
                  e.target.value = "";
                  return;
                }

                const url = URL.createObjectURL(file);
                setAvatarPreview(url);
                setAvatarPreviewError(false);
                setProfileFile(file);
                setField("avatarUrl", url);
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex overflow-hidden rounded-2xl bg-gray-100 p-1">
          {isRTL ? (
            <>
              <button
                type="button"
                onClick={() => setTab("basic")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "basic" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.basic")}
              </button>

              <button
                type="button"
                onClick={() => setTab("hours")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "hours" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.hours") || "ساعات العمل"}
              </button>

              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "login" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.login")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "login" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.login")}
              </button>

              <button
                type="button"
                onClick={() => setTab("hours")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "hours" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.hours") || "Hours"}
              </button>

              <button
                type="button"
                onClick={() => setTab("basic")}
                className={`flex-1 rounded-2xl px-2 py-2 text-xs ${tab === "basic" ? "bg-[#7BAE6A] text-white" : "text-gray-500"
                  }`}
              >
                {t("provider.providerTeam.tabs.basic")}
              </button>
            </>
          )}
        </div>

        <div className={`mt-3 max-h-[55vh] overflow-y-auto ${isRTL ? "pl-4 pr-1" : "pr-4 pl-1"}`}>
          {externalError ? (
            <p className="mb-3 text-center text-sm font-medium text-red-600">
              {externalError}
            </p>
          ) : null}

          {avatarError ? (
            <p className="mb-3 text-center text-sm font-medium text-red-600">
              {avatarError}
            </p>
          ) : null}

          {tab === "hours" ? (
            <WorkingHoursTab
              form={form}
              setForm={setForm}
              effectiveProviderHours={effectiveProviderHours}
              isRTL={isRTL}
              t={t}
              saving={saving}
              onSave={() => {
                const basicErrors = validateBasic();
                if (Object.keys(basicErrors).length > 0) {
                  setErrors((prev) => ({ ...prev, ...basicErrors }));
                  setTab("basic");
                  return;
                }

                const loginErrors = validateLogin();
                if (Object.keys(loginErrors).length > 0) {
                  setErrors((prev) => ({ ...prev, ...loginErrors }));
                  setTab("login");
                  return;
                }

                setErrors({});
                finalizeSave();
              }}
            />
          ) : tab === "basic" ? (
            <div className="space-y-3">
              <Field
                label={t("provider.providerTeam.fields.name")}
                required
                value={form.name}
                placeholder={t("provider.providerTeam.placeholders.name")}
                onChange={(v) => setField("name", v)}
                error={errors.name}
              />

              <Field
                label={t("provider.providerTeam.fields.email")}
                value={form.email ?? ""}
                placeholder={t("provider.providerTeam.placeholders.email")}
                onChange={(v) => setField("email", v)}
              />

              <div>
                <div className="mb-1 text-xs text-gray-600">
                  {t("provider.providerTeam.fields.jobTitle")}{" "}
                  <span className="text-red-500">*</span>
                </div>

                <select
                  value={form.positionId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;

                    setField("positionId", id);

                    const obj = positionOptions.find((x) => x._id === id);
                    const label = pickLocalized(obj?.name, lang) || "";

                    setField("positionLabel", label as any);
                    setField("jobTitle", label);
                  }}
                  disabled={lookupsLoading}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#7BAE6A] bg-white disabled:opacity-60"
                >
                  <option value="">
                    {isRTL ? "اختر المنصب" : "Select position"}
                  </option>

                  {positionOptions.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {pickLocalized(opt.name, lang) || opt.code}
                    </option>
                  ))}
                </select>

                {errors.positionId ? (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.positionId}
                  </p>
                ) : null}

                {lookupsError ? (
                  <p className="mt-1 text-xs text-red-500">{lookupsError}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 text-xs text-gray-600">
                    {isRTL ? "الجنس" : "Gender"} <span className="text-red-500">*</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setField("gender", "MALE")}
                      className={`flex-1 rounded-2xl border py-2 text-sm ${
                        form.gender === "MALE"
                          ? "bg-[#7BAE6A] text-white border-[#7BAE6A]"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isRTL ? "ذكر" : "Male"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("gender", "FEMALE")}
                      className={`flex-1 rounded-2xl border py-2 text-sm ${
                        form.gender === "FEMALE"
                          ? "bg-[#7BAE6A] text-white border-[#7BAE6A]"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isRTL ? "أنثى" : "Female"}
                    </button>
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-xs text-gray-600">
                    {isRTL ? "يعمل لـ" : "Works for"} <span className="text-red-500">*</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setField("workFor", "MALE")}
                      className={`flex-1 rounded-xl border py-2 text-xs ${
                        form.workFor === "MALE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isRTL ? "رجال" : "Male"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("workFor", "FEMALE")}
                      className={`flex-1 rounded-xl border py-2 text-xs ${
                        form.workFor === "FEMALE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isRTL ? "نساء" : "Female"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("workFor", "BOTH")}
                      className={`flex-1 rounded-xl border py-2 text-xs ${
                        form.workFor === "BOTH"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {isRTL ? "الكل" : "Both"}
                    </button>
                  </div>
                  {errors.workFor && (
                    <p className="mt-1 text-xs text-red-500">{errors.workFor}</p>
                  )}
                </div>
              </div>

              <Row label={t("provider.providerTeam.fields.active")}>
                <Switch
                  checked={form.active}
                  onChange={(v) => {
                    setField("active", v); 
                  }}
                />
              </Row>

              <button
                type="button"
                onClick={applyBasic}
                className="mt-1 w-full rounded-2xl bg-[#7BAE6A] py-2.5 text-[14px] font-semibold text-white"
              >
                {t("provider.common.apply")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field
                label={t("provider.providerTeam.fields.phone")}
                required
                value={form.phone ?? ""}
                placeholder={t("provider.providerTeam.placeholders.phone")}
                onChange={(v) =>
                  setField("phone", v.replace(/\D/g, "").slice(0, 10))
                }
                inputMode="numeric"
                error={errors.phone}
                maxLength={10}
              />

              <div className="pt-1 text-sm font-semibold text-gray-700">
                {t("provider.providerTeam.roles.title")}
              </div>

              <RoleRow
                label={t("provider.providerTeam.roles.canLogin")}
                checked={form.roles.canLogin}
                onChange={(v) => setRole("canLogin", v)}
              />
              <RoleRow
                label={t("provider.providerTeam.roles.canViewBookings")}
                checked={form.roles.canViewBookings}
                onChange={(v) => setRole("canViewBookings", v)}
              />
              <RoleRow
                label={t("provider.providerTeam.roles.canViewStats")}
                checked={form.roles.canViewStats}
                onChange={(v) => setRole("canViewStats", v)}
              />
              <RoleRow
                label={t("provider.providerTeam.roles.canAddBreak")}
                checked={form.roles.canAddBreak}
                onChange={(v) => setRole("canAddBreak", v)}
              />

              <button
                type="button"
                disabled={saving}
                onClick={saveAll}
                className="mt-1 w-full rounded-2xl bg-[#7BAE6A] py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? t("provider.common.saving") : t("provider.common.save")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DAYS: { key: DayKey; labelKey: string }[] = [
  { key: "sunday", labelKey: "days.sunday" },
  { key: "monday", labelKey: "days.monday" },
  { key: "tuesday", labelKey: "days.tuesday" },
  { key: "wednesday", labelKey: "days.wednesday" },
  { key: "thursday", labelKey: "days.thursday" },
  { key: "friday", labelKey: "days.friday" },
  { key: "saturday", labelKey: "days.saturday" },
];

function WorkingHoursTab({
  form,
  setForm,
  effectiveProviderHours,
  isRTL,
  t,
  saving,
  onSave,
}: {
  form: TeamMemberForm;
  setForm: React.Dispatch<React.SetStateAction<TeamMemberForm>>;
  effectiveProviderHours: WorkingHoursSchedule;
  isRTL: boolean;
  t: (key: string) => string;
  saving: boolean;
  onSave: () => void;
}) {
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);

  const currentHours = form.useCustomHours
    ? form.workingHours || effectiveProviderHours
    : effectiveProviderHours;

  const toggleUseCustom = (useCustom: boolean) => {
    setForm((prev) => ({
      ...prev,
      useCustomHours: useCustom,
      workingHours: useCustom
        ? prev.workingHours || { ...effectiveProviderHours }
        : prev.workingHours,
    }));
  };

  const toggleDay = (day: DayKey) => {
    if (!form.useCustomHours) return;
    const wh = form.workingHours || { ...effectiveProviderHours };
    setForm((prev) => ({
      ...prev,
      workingHours: {
        ...wh,
        [day]: { ...wh[day], open: !wh[day].open },
      },
    }));
  };

  const updateDayTime = (day: DayKey, field: "from" | "to", value: string) => {
    if (!form.useCustomHours) return;
    const wh = form.workingHours || { ...effectiveProviderHours };
    setForm((prev) => ({
      ...prev,
      workingHours: {
        ...wh,
        [day]: { ...wh[day], [field]: value },
      },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="text-sm text-gray-700">
          {isRTL ? "تخصيص ساعات العمل" : "Custom working hours"}
        </div>
        <Switch
          checked={form.useCustomHours ?? false}
          onChange={toggleUseCustom}
        />
      </div>

      {!form.useCustomHours && (
        <p className="text-xs text-gray-500 text-center">
          {isRTL
            ? "سيتم استخدام ساعات عمل مقدم الخدمة الافتراضية"
            : "Using provider's default working hours"}
        </p>
      )}

      <div className="space-y-2">
        {DAYS.map(({ key, labelKey }) => {
          const day = currentHours[key];
          const isEditing = editingDay === key;
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!form.useCustomHours}
                  onClick={() => toggleDay(key)}
                  className={[
                    "relative h-5 w-9 rounded-full transition",
                    day.open ? "bg-[#7FAE6A]" : "bg-gray-300",
                    !form.useCustomHours ? "opacity-50 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
                      day.open
                        ? isRTL
                          ? "right-0.5"
                          : "left-4"
                        : isRTL
                          ? "right-4"
                          : "left-0.5",
                    ].join(" ")}
                  />
                </button>
                <span className="text-xs font-medium text-gray-900">
                  {t(labelKey)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!day.open ? (
                  <span className="text-xs text-red-500">
                    {t("provider.workingHours.closed") ||
                      (isRTL ? "مغلق" : "Closed")}
                  </span>
                ) : isEditing && form.useCustomHours ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={day.from}
                      onChange={(e) =>
                        updateDayTime(key, "from", e.target.value)
                      }
                      className="w-32 min-w-[130px] rounded border border-gray-200 px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-gray-400">-</span>
                    <input
                      type="time"
                      value={day.to}
                      onChange={(e) => updateDayTime(key, "to", e.target.value)}
                      className="w-32 min-w-[130px] rounded border border-gray-200 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingDay(null)}
                      className="text-xs text-[#7BAE6A] font-medium"
                    >
                      {isRTL ? "تم" : "Done"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!form.useCustomHours}
                    onClick={() => form.useCustomHours && setEditingDay(key)}
                    className={[
                      "text-xs text-gray-500",
                      !form.useCustomHours ? "cursor-default" : "",
                    ].join(" ")}
                  >
                    {day.from} - {day.to}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="mt-3 w-full rounded-2xl bg-[#7BAE6A] py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {saving ? t("provider.common.saving") : t("provider.common.save")}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  required,
  inputMode,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-gray-600">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </div>

      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:border-[#7BAE6A] ${error ? "border-red-400" : "border-gray-200"
          }`}
      />

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5">
      <div className="text-sm text-gray-700">{label}</div>
      {children}
    </div>
  );
}

function RoleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label}>
      <Switch checked={checked} onChange={onChange} />
    </Row>
  );
}
