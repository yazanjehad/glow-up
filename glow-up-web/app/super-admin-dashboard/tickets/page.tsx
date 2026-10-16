"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  UserPlus,
  Lock,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  Ticket,
  Priority,
} from "@/integration/services/tickets/ticket.types";
import {
  fetchAllTickets,
  addTicketMessage,
  updateTicketStatus,
  assignTicketToAdmin,
} from "@/integration/services/tickets/ticket.service";
import { adminService } from "@/integration/services/admins/admin.service";
import type { AdminUi } from "@/integration/services/admins/admin.type";
import { NoPermission } from "@/components/auth/NoPermission";
import {
  hasPermission,
  PermissionType,
  isSuperAdmin,
} from "@/lib/auth/permissions";

const PRIORITY_MAP = {
  URGENT: {
    color: "bg-purple-500",
    text: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  HIGH: {
    color: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  MEDIUM: {
    color: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  LOW: {
    color: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
} as const;

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> =
{
  OPEN: { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
  IN_PROGRESS: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
  },
  RESOLVED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  CLOSED: {
    dot: "bg-slate-400",
    text: "text-slate-500",
    bg: "bg-slate-50",
  },
};

const CATEGORY_OPTIONS = [
  "ALL",
  "PAYMENT_ISSUE",
  "TECHNICAL_ISSUE",
  "BOOKING_ISSUE",
  "ACCOUNT_ISSUE",
  "REPORT_PROVIDER",
  "REPORT_EMPLOYEE",
  "GENERAL_INQUIRY",
] as const;

export default function AdvancedAdminTickets() {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === "ar";

  const isAdmin = isSuperAdmin();
  const canViewTickets = isAdmin || hasPermission([PermissionType.TICKET_VIEW]);
  const canReplyTickets =
    isAdmin || hasPermission([PermissionType.TICKET_REPLY]);
  const canAccessPage = canViewTickets || canReplyTickets;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const getCategoryLabel = (category: string) => {
    if (!category || category === "ALL") return t("commonD.all", "All");
    return t(`supportCenter.categories.${category}`, category);
  };

  const loadTickets = async () => {
    if (!canAccessPage) return;
    setLoading(true);
    setForbidden(false);
    try {
      const data = await fetchAllTickets({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
      });
      setTickets(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch tickets:", error);
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, isRTL, statusFilter, categoryFilter, canAccessPage]);

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return tickets.filter((tk: any) => {
      const matchSearch =
        !q ||
        (tk.subject || "").toLowerCase().includes(q) ||
        (tk._id || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || (tk.status || "") === statusFilter;

      const matchCategory =
        categoryFilter === "ALL" || (tk.category || "") === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  if (!canAccessPage) {
    return <NoPermission />;
  }

  const showListNoPermission = !canViewTickets || forbidden;

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {t("supportCenter.title")}
            </h1>
            <p className="text-slate-500 text-sm">
              {t("supportCenter.manageTickets")}
            </p>
          </div>

          <div className="flex gap-2 flex-col sm:flex-row flex-wrap items-stretch sm:items-center w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search
                className={`absolute ${isRTL ? "right-3" : "left-3"
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`}
              />
              <input
                type="text"
                placeholder={t("supportCenter.searchTickets")}
                className={`${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  } py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 shadow-sm`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto py-2 bg-white border border-slate-200 rounded-lg text-sm px-3 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              title="Category"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {getCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("supportCenter.allTickets")}
            count={tickets.length}
            icon={<Inbox className="w-5 h-5" />}
            color="indigo"
          />
          <StatCard
            title={t("supportCenter.open")}
            count={tickets.filter((tk: any) => tk.status === "OPEN").length}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title={t("supportCenter.IN_PROGRESS")}
            count={tickets.filter((tk: any) => tk.status === "IN_PROGRESS").length}
            icon={<Loader2 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title={t("supportCenter.resolved")}
            count={
              tickets.filter(
                (tk: any) => tk.status === "RESOLVED" || tk.status === "CLOSED",
              ).length
            }
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${statusFilter === s
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              type="button"
            >
              {t(`supportCenter.${s}`)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {showListNoPermission ? (
            <NoPermission type="tickets" />
          ) : loading ? (
            <div className="p-10 md:p-16 flex items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">
                {t("commonD.loading")}
              </span>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start w-1/3">
                        {t("supportCenter.issue")}
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">
                        {t("supportCenter.priority")}
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-start">
                        {t("supportCenter.status")}
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-end">
                        {t("supportCenter.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket: any) => (
                      <TicketRow
                        key={ticket._id}
                        ticket={ticket}
                        isExpanded={expandedId === ticket._id}
                        onToggle={() =>
                          setExpandedId(
                            expandedId === ticket._id ? null : ticket._id,
                          )
                        }
                        refreshTickets={loadTickets}
                        t={t}
                        isRTL={isRTL}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-4">
                {filteredTickets.map((ticket: any) => (
                  <TicketMobileCard
                    key={ticket._id}
                    ticket={ticket}
                    isExpanded={expandedId === ticket._id}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === ticket._id ? null : ticket._id,
                      )
                    }
                    refreshTickets={loadTickets}
                    t={t}
                    isRTL={isRTL}
                    getCategoryLabel={getCategoryLabel}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">
              {t("supportCenter.noTicketsFound")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  isExpanded,
  onToggle,
  refreshTickets,
  t,
  isRTL,
}: any) {
  const p =
    PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP] ||
    PRIORITY_MAP.LOW;
  const s = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

  const [msg, setMsg] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const handlePriorityChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    const newPriority = e.target.value as Priority;
    setLoadingAction(true);
    try {
      await updateTicketStatus(ticket._id, ticket.status, newPriority);
      refreshTickets();
    } catch (err) {
      console.error("Priority update failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value as
      | "OPEN"
      | "IN_PROGRESS"
      | "RESOLVED"
      | "CLOSED";

    if (newStatus === "IN_PROGRESS" && !ticket.assignedAdmin) {
      setShowAssignModal(true);
      return;
    }

    setLoadingAction(true);
    try {
      await updateTicketStatus(ticket._id, newStatus, ticket.priority);

      if (newStatus === "OPEN" && ticket.assignedAdmin) {
        await assignTicketToAdmin(ticket._id, null);
      }

      refreshTickets();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSend = async () => {
    if (!msg.trim()) return;
    try {
      await addTicketMessage(ticket._id, msg, isPrivate);
      setMsg("");
      setIsPrivate(false);
      refreshTickets();
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  const currentAdminId = useMemo(() => {
    if (typeof window === "undefined") return "";

    const token = localStorage.getItem("accessToken");
    if (!token) return "";

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload._id || "";
    } catch {
      return "";
    }
  }, []);

  const isSuper = isSuperAdmin();

  const canUpdateStatus =
    isSuper || String(ticket.assignedAdmin) === String(currentAdminId);

  const canUpdatePriority = isSuper;

  return (
    <>
      <tr
        className={`group transition-colors ${isExpanded ? "bg-indigo-50/40" : "hover:bg-slate-50 cursor-pointer"
          } ${loadingAction ? "opacity-60 pointer-events-none" : ""}`}
        onClick={onToggle}
      >
        <td className="px-6 py-4 relative">
          <div
            className={`absolute ${isRTL ? "right-0" : "left-0"
              } top-0 bottom-0 w-1 ${p.color}`}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">
              {t(`supportCenter.categories.${ticket.subject}`, ticket.subject)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 font-mono uppercase">
              #{String(ticket._id).slice(-6)}
            </span>
          </div>
        </td>

        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <select
            value={ticket.priority}
            onChange={handlePriorityChange}
            disabled={!canUpdatePriority || loadingAction}
            className={`appearance-none cursor-pointer inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-bold uppercase outline-none transition-all ${p.bg} ${p.text} ${p.border} hover:brightness-95`}
          >
            <option value="LOW">{t("supportCenter.LOW")}</option>
            <option value="MEDIUM">{t("supportCenter.MEDIUM")}</option>
            <option value="HIGH">{t("supportCenter.HIGH")}</option>
            <option value="URGENT">{t("supportCenter.URGENT")}</option>
          </select>
        </td>

        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <select
            value={ticket.status}
            onChange={handleStatusChange}
            disabled={!canUpdateStatus || loadingAction}
            className={`cursor-pointer px-2 py-1 rounded-md border text-[10px] font-bold uppercase outline-none ${s.bg} ${s.text} border-slate-200`}
          >
            <option value="OPEN">{t("supportCenter.OPEN")}</option>
            <option value="IN_PROGRESS">
              {t("supportCenter.IN_PROGRESS")}
            </option>
            <option value="RESOLVED">{t("supportCenter.RESOLVED")}</option>
            <option value="CLOSED">{t("supportCenter.CLOSED")}</option>
          </select>
        </td>

        <td className="px-8 py-4 text-end">
          <button className="text-slate-400 hover:text-slate-600" type="button">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td
            colSpan={4}
            className="px-6 py-8 bg-white border-b border-slate-200"
          >
            <TicketExpandedContent
              ticket={ticket}
              msg={msg}
              setMsg={setMsg}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              handleSend={handleSend}
              showAssignModal={showAssignModal}
              setShowAssignModal={setShowAssignModal}
              refreshTickets={refreshTickets}
              t={t}
              getCategoryLabel={(category: string) => {
                if (!category || category === "ALL")
                  return t("commonD.all", "All");
                return t(`supportCenter.categories.${category}`, category);
              }}
            />
          </td>
        </tr>
      )}

      {showAssignModal && (
        <AssignModal
          ticketId={ticket._id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={refreshTickets}
          t={t}
        />
      )}
    </>
  );
}

function TicketMobileCard({
  ticket,
  isExpanded,
  onToggle,
  refreshTickets,
  t,
  isRTL,
  getCategoryLabel,
}: any) {
  const p =
    PRIORITY_MAP[ticket.priority as keyof typeof PRIORITY_MAP] ||
    PRIORITY_MAP.LOW;
  const s = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

  const [msg, setMsg] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const handlePriorityChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    const newPriority = e.target.value as Priority;
    setLoadingAction(true);
    try {
      await updateTicketStatus(ticket._id, ticket.status, newPriority);
      refreshTickets();
    } catch (err) {
      console.error("Priority update failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value as
      | "OPEN"
      | "IN_PROGRESS"
      | "RESOLVED"
      | "CLOSED";

    if (newStatus === "IN_PROGRESS" && !ticket.assignedAdmin) {
      setShowAssignModal(true);
      return;
    }

    setLoadingAction(true);
    try {
      await updateTicketStatus(ticket._id, newStatus, ticket.priority);

      if (newStatus === "OPEN" && ticket.assignedAdmin) {
        await assignTicketToAdmin(ticket._id, null);
      }

      refreshTickets();
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSend = async () => {
    if (!msg.trim()) return;
    try {
      await addTicketMessage(ticket._id, msg, isPrivate);
      setMsg("");
      setIsPrivate(false);
      refreshTickets();
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  const currentAdminId = useMemo(() => {
    if (typeof window === "undefined") return "";

    const token = localStorage.getItem("accessToken");
    if (!token) return "";

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload._id || "";
    } catch {
      return "";
    }
  }, []);

  const isSuper = isSuperAdmin();

  const canUpdateStatus =
    isSuper || String(ticket.assignedAdmin) === String(currentAdminId);

  const canUpdatePriority = isSuper;

  return (
    <>
      <div
        className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${loadingAction ? "opacity-60 pointer-events-none" : ""
          }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="w-full p-4 text-start"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-10 w-1 rounded-full ${p.color}`} />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 break-words">
                    {t(`supportCenter.categories.${ticket.subject}`, ticket.subject)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono uppercase">
                    #{String(ticket._id).slice(-6)}
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-slate-400">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MobileBadgeBox
              label={t("supportCenter.priority")}
              value={
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-bold uppercase ${p.bg} ${p.text} ${p.border}`}
                >
                  {t(`supportCenter.${ticket.priority}`)}
                </span>
              }
            />
            <MobileBadgeBox
              label={t("supportCenter.status")}
              value={
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${s.bg} ${s.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {t(`supportCenter.${ticket.status}`)}
                </span>
              }
            />
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/30">
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t("supportCenter.priority")}
                </label>
                <select
                  value={ticket.priority}
                  onChange={handlePriorityChange}
                  disabled={!canUpdatePriority || loadingAction}
                  className={`w-full cursor-pointer px-3 py-2 rounded-xl border text-[11px] font-bold uppercase outline-none ${p.bg} ${p.text} ${p.border}`}
                >
                  <option value="LOW">{t("supportCenter.LOW")}</option>
                  <option value="MEDIUM">{t("supportCenter.MEDIUM")}</option>
                  <option value="HIGH">{t("supportCenter.HIGH")}</option>
                  <option value="URGENT">{t("supportCenter.URGENT")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t("supportCenter.status")}
                </label>
                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={!canUpdateStatus || loadingAction}
                  className={`w-full cursor-pointer px-3 py-2 rounded-xl border text-[11px] font-bold uppercase outline-none ${s.bg} ${s.text} border-slate-200`}
                >
                  <option value="OPEN">{t("supportCenter.OPEN")}</option>
                  <option value="IN_PROGRESS">
                    {t("supportCenter.IN_PROGRESS")}
                  </option>
                  <option value="RESOLVED">
                    {t("supportCenter.RESOLVED")}
                  </option>
                  <option value="CLOSED">{t("supportCenter.CLOSED")}</option>
                </select>
              </div>
            </div>

            <TicketExpandedContent
              ticket={ticket}
              msg={msg}
              setMsg={setMsg}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              handleSend={handleSend}
              showAssignModal={showAssignModal}
              setShowAssignModal={setShowAssignModal}
              refreshTickets={refreshTickets}
              t={t}
              getCategoryLabel={getCategoryLabel}
              mobile
            />
          </div>
        )}
      </div>

      {showAssignModal && (
        <AssignModal
          ticketId={ticket._id}
          onClose={() => setShowAssignModal(false)}
          onSuccess={refreshTickets}
          t={t}
        />
      )}
    </>
  );
}

function TicketExpandedContent({
  ticket,
  msg,
  setMsg,
  isPrivate,
  setIsPrivate,
  handleSend,
  setShowAssignModal,
  t,
  getCategoryLabel,
  mobile = false,
}: any) {
  return (
    <div
      className={`grid grid-cols-1 ${mobile ? "gap-4" : "lg:grid-cols-12 gap-8"}`}
    >
      <div className={mobile ? "" : "lg:col-span-8 flex flex-col h-[450px]"}>
        <div
          className={`${mobile ? "max-h-[320px]" : "flex-1"
            } overflow-y-auto space-y-4 px-2 custom-scrollbar`}
        >
          {ticket.messages?.map((m: any, i: number) => (
            <div
              key={i}
              className={`flex flex-col ${m.senderRole !== "CUSTOMER" ? "items-end" : "items-start"
                }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm relative ${m.isInternalNote
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : m.senderRole !== "CUSTOMER"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700"
                  }`}
              >
                {m.isInternalNote && (
                  <Lock className="w-3 h-3 absolute -top-2 -right-1 text-amber-600" />
                )}
                <span className="break-words">{m.message}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 italic">
                {m.time}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all" />
                <Lock className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                {t("internalNote")}
              </span>
            </label>
          </div>

          <div className={`flex ${mobile ? "flex-col" : "gap-2"} gap-2`}>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={
                isPrivate
                  ? t("typeInternalNote")
                  : t("supportCenter.typeResponse")
              }
              className={`flex-1 border rounded-xl px-4 py-2 text-sm outline-none transition-all ${isPrivate
                ? "bg-amber-50/50 border-amber-200 focus:ring-amber-500"
                : "bg-slate-50 border-slate-200 focus:ring-indigo-500"
                }`}
            />
            <button
              onClick={handleSend}
              type="button"
              className={`${mobile ? "w-full justify-center" : ""
                } p-2 rounded-xl text-white transition-all flex items-center ${isPrivate
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={mobile ? "space-y-4" : "lg:col-span-4 space-y-4"}>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {t("supportCenter.metadata")}
          </h4>
          <div className="space-y-2">
            <MetaItem
              label={t("supportCenter.createdAt")}
              value={new Date(ticket.createdAt).toLocaleDateString()}
            />
            <MetaItem
              label={t("supportCenter.category")}
              value={getCategoryLabel(ticket.category)}
            />
            <MetaItem
              label={t("supportCenter.assignedAdmin")}
              value={ticket.assignedAdmin || t("unassigned")}
              highlight
            />
          </div>
        </div>

        {!ticket.assignedAdmin &&
          ticket.status !== "CLOSED" &&
          ticket.status !== "RESOLVED" && (
            <button
              onClick={() => setShowAssignModal(true)}
              type="button"
              className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {t("supportCenter.assignToAdmin")}
            </button>
          )}
      </div>
    </div>
  );
}

function AssignModal({ ticketId, onClose, onSuccess, t }: any) {
  const [admins, setAdmins] = useState<AdminUi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await adminService.getAdmins({ limit: 100 });
        setAdmins(res.data);
      } catch (e) {
        console.error("Error fetching admins", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleAssign = async (adminId: string) => {
    try {
      await assignTicketToAdmin(ticketId, adminId);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error assigning ticket");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">
            {t("supportCenter.selectAdmin")}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="hover:bg-slate-200 p-1 rounded-full"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : admins.length > 0 ? (
            admins.map((admin) => (
              <button
                key={admin.id}
                onClick={() => handleAssign(admin.id)}
                type="button"
                className="w-full text-start p-3 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-indigo-100 transition-colors shrink-0">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-700 break-words">
                    {admin.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {admin.id.slice(-8)}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              {t("noAdminsFound")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, icon, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50",
    red: "text-red-600 bg-red-50",
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50",
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm gap-3">
      <div className="min-w-0">
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">
          {title}
        </p>
        <p className="text-xl font-black text-slate-900">{count}</p>
      </div>
      <div className={`p-2 rounded-lg shrink-0 ${colors[color]}`}>{icon}</div>
    </div>
  );
}

function MetaItem({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center gap-3 text-xs">
      <span className="text-slate-500 font-medium">{label}</span>
      <span
        className={`font-bold break-words text-end ${highlight ? "text-indigo-600" : "text-slate-700"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

function MobileBadgeBox({ label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-semibold text-slate-400 mb-2 uppercase">
        {label}
      </p>
      <div>{value}</div>
    </div>
  );
}
