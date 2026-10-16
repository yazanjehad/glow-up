"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type RowsOption = number;

type PaginationBarProps = {
  page: number;
  totalPages: number;
  limit: number;
  disabled?: boolean;
  isRTL?: boolean;

  rowsOptions?: RowsOption[];
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;

  scrollToTop?: boolean;
};

export default function PaginationBar({
  page,
  totalPages,
  limit,
  disabled = false,
  isRTL = false,
  rowsOptions = [10, 20, 50],
  onPageChange,
  onLimitChange,
  scrollToTop = true,
}: PaginationBarProps) {
  const safeTotalPages = Math.max(1, Number(totalPages || 1));
  const safePage = Math.min(Math.max(1, Number(page || 1)), safeTotalPages);

  const canFirst = safePage > 1 && !disabled;
  const canPrev = safePage > 1 && !disabled;
  const canNext = safePage < safeTotalPages && !disabled;
  const canLast = safePage < safeTotalPages && !disabled;

  const orderedRowsOptions = useMemo(() => {
    const set = new Set(rowsOptions.filter((n) => Number.isFinite(n) && n > 0));
    set.add(limit);
    return Array.from(set).sort((a, b) => a - b);
  }, [rowsOptions, limit]);

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), safeTotalPages);
    if (next === safePage) return;

    onPageChange(next);

    if (scrollToTop && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const changeLimit = (v: number) => {
    if (!onLimitChange) return;
    onLimitChange(v);
    onPageChange(1);

    if (scrollToTop && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 bg-white border border-slate-200 rounded-2xl">
      {/* Rows per page */}
      <div
        className={`flex items-center justify-between sm:justify-start gap-2 min-w-0 ${
          isRTL ? "sm:order-3" : "sm:order-1"
        }`}
      >
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          {isRTL ? "عدد الصفوف" : "Rows per page"}
        </span>

        <select
          disabled={disabled || !onLimitChange}
          value={limit}
          onChange={(e) => changeLimit(Number(e.target.value))}
          className="h-9 min-w-[72px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        >
          {orderedRowsOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Page info */}
      <div
        className={`text-xs font-semibold text-slate-600 text-center whitespace-nowrap ${
          isRTL ? "sm:order-2" : "sm:order-2"
        }`}
      >
        {isRTL ? (
          <>
            الصفحة <span className="font-black text-slate-900">{safePage}</span>{" "}
            من{" "}
            <span className="font-black text-slate-900">{safeTotalPages}</span>
          </>
        ) : (
          <>
            Page <span className="font-black text-slate-900">{safePage}</span>{" "}
            of{" "}
            <span className="font-black text-slate-900">{safeTotalPages}</span>
          </>
        )}
      </div>

      {/* Nav buttons */}
      <div
        className={`flex items-center justify-center gap-2 ${
          isRTL ? "sm:order-1" : "sm:order-3"
        }`}
      >
        <IconBtn disabled={!canFirst} onClick={() => go(1)} ariaLabel="First">
          <FirstIcon className="w-4 h-4" />
        </IconBtn>

        <IconBtn
          disabled={!canPrev}
          onClick={() => go(safePage - 1)}
          ariaLabel="Previous"
        >
          <PrevIcon className="w-4 h-4" />
        </IconBtn>

        <IconBtn
          disabled={!canNext}
          onClick={() => go(safePage + 1)}
          ariaLabel="Next"
        >
          <NextIcon className="w-4 h-4" />
        </IconBtn>

        <IconBtn
          disabled={!canLast}
          onClick={() => go(safeTotalPages)}
          ariaLabel="Last"
        >
          <LastIcon className="w-4 h-4" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition shrink-0"
    >
      {children}
    </button>
  );
}
