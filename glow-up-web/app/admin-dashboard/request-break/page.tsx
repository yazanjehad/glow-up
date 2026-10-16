"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, Calendar, Clock, FileText, Loader2, CheckCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { breakRequestService, BreakRequestPayload, BreakRequest, BreakStatus } from "@/integration/services/employees/breakRequest.service";
import { hasEmployeeCapability } from "@/lib/auth/permissions";

const statusBadgeClass = (s: BreakStatus) => {
  const v = (s || "").toUpperCase();
  if (v === "APPROVED") return "bg-emerald-50 text-emerald-600 border-emerald-100/50";
  if (v === "REJECTED") return "bg-rose-50 text-rose-600 border-rose-100/50";
  return "bg-amber-50 text-amber-600 border-amber-100/50"; // PENDING
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function RequestBreakPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [form, setForm] = useState<BreakRequestPayload>({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [breaks, setBreaks] = useState<BreakRequest[]>([]);

  const canManageBreak = hasEmployeeCapability("canManageBreakTime");

  const fetchBreaks = useCallback(async () => {
    try {
      setListLoading(true);
      const data = await breakRequestService.getEmployeeBreaks();
      setBreaks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch breaks:", e);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageBreak) {
      fetchBreaks();
    }
  }, [canManageBreak, fetchBreaks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.date) {
      setError(t("breakRequest.validation.dateRequired"));
      return;
    }
    if (!form.startTime) {
      setError(t("breakRequest.validation.startTimeRequired"));
      return;
    }
    if (!form.endTime) {
      setError(t("breakRequest.validation.endTimeRequired"));
      return;
    }
    if (!form.reason.trim()) {
      setError(t("breakRequest.validation.reasonRequired"));
      return;
    }

    if (form.startTime >= form.endTime) {
      setError(t("breakRequest.validation.endTimeAfterStart"));
      return;
    }

    try {
      setLoading(true);
      await breakRequestService.requestBreak({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason.trim(),
      });
      setSuccess(true);
      setForm({ date: "", startTime: "", endTime: "", reason: "" });
      setShowForm(false);
      fetchBreaks();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || t("breakRequest.errors.submitFailed");
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!canManageBreak) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
        <div className="bg-white rounded-[20px] border border-gray-100 p-8 text-center">
          <Coffee className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t("breakRequest.noAccess")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("breakRequest.noAccessDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e2ecdf]">
            <Coffee className="h-5 w-5 text-[#79a66b]" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900">
              {t("breakRequest.title")}
            </h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {t("breakRequest.subtitle")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => { setShowForm(true); setError(""); setSuccess(false); }}
          className="bg-[#79a66b] hover:bg-[#6a9460] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("breakRequest.newRequest")}
        </Button>
      </header>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{t("breakRequest.success")}</p>
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[20px] border border-gray-100 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t("breakRequest.newRequest")}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {t("breakRequest.fields.date")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {t("breakRequest.fields.startTime")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {t("breakRequest.fields.endTime")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {t("breakRequest.fields.reason")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={t("breakRequest.placeholders.reason")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#79a66b] focus:border-transparent resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#79a66b] hover:bg-[#6a9460] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      {t("loading")}
                    </>
                  ) : (
                    t("breakRequest.submit")
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Break Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{t("breakRequest.myRequests")}</h3>
        </div>

        {listLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-200 border-t-[#79A66B] rounded-full"></div>
          </div>
        ) : breaks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {t("breakRequest.noRequests")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-3 text-start font-semibold text-gray-500 text-xs uppercase">{t("breakRequest.fields.date")}</th>
                  <th className="p-3 text-start font-semibold text-gray-500 text-xs uppercase">{t("breakRequest.fields.startTime")}</th>
                  <th className="p-3 text-start font-semibold text-gray-500 text-xs uppercase">{t("breakRequest.fields.endTime")}</th>
                  <th className="p-3 text-start font-semibold text-gray-500 text-xs uppercase">{t("breakRequest.fields.reason")}</th>
                  <th className="p-3 text-center font-semibold text-gray-500 text-xs uppercase">{t("commonD.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {breaks.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-gray-700 text-start">{formatDate(b.date)}</td>
                    <td className="p-3 text-gray-600 text-start">{b.startTime}</td>
                    <td className="p-3 text-gray-600 text-start">{b.endTime}</td>
                    <td className="p-3 text-gray-600 text-start max-w-[200px] truncate">{b.reason}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusBadgeClass(b.status)}`}>
                        {t(`breakRequest.status.${b.status.toLowerCase()}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
