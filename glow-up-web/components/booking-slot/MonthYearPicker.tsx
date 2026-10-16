"use client";

import { useEffect, useMemo } from "react";
// Props for MonthYearPicker component
type Props = {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
  yearsAhead?: number;
  locale?: string;
};
// MonthYearPicker component
export function MonthYearPicker({
  value,
  onChange,
  yearsAhead = 15,
  locale = "ar",
}: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
// Generate list of years
  const years = useMemo(() => {
    return Array.from({ length: yearsAhead + 1 }, (_, i) => currentYear + i);
  }, [currentYear, yearsAhead]);

  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2020, i, 1);
      return new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
    });
  }, [locale]);
// Generate list of available months based on selected year
  const availableMonths = useMemo(() => {
    const startMonth = value.year === currentYear ? currentMonth : 1;
    return Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i);
  }, [value.year, currentYear, currentMonth]);

  const safeMonth = availableMonths.includes(value.month)
    ? value.month
    : availableMonths[0];

  // Ensure month is valid when year changes
  useEffect(() => {
    if (safeMonth && safeMonth !== value.month) {
      onChange({ year: value.year, month: safeMonth });
    }
  }, [safeMonth, value.year, value.month, onChange]);

  return (
    <div className="flex items-center gap-3">
      <select
        className="h-10 rounded-md border bg-white px-3 text-sm"
        value={value.year}
        onChange={(e) => {
          const newYear = Number(e.target.value);
          const minMonth = newYear === currentYear ? currentMonth : 1;
          const newMonth = Math.max(value.month, minMonth);
          onChange({ year: newYear, month: newMonth });
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border bg-white px-3 text-sm"
        value={safeMonth}
        onChange={(e) =>
          onChange({ year: value.year, month: Number(e.target.value) })
        }
      >
        {availableMonths.map((m) => (
          <option key={m} value={m}>
            {monthNames[m - 1]}
          </option>
        ))}
      </select>
    </div>
  );
}
