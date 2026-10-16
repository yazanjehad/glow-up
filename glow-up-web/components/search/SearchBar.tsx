"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchValues } from "@/app/models/SearchValues";
import { useLookups } from "@/hooks/useLookups";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";

type SearchBarProps = {
  onSearch: (values: SearchValues) => void;
};

const BRAND = "#79A66B";
const BRAND_SOFT = "#E6F0E3";

export function SearchBar({ onSearch }: SearchBarProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";

  const { providerTypes, categories } = useLookups(); 

  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState("");
  const [serviceCategory, setServiceCategory] = useState(""); 
  const [sortBy, setSortBy] = useState("");

  const values = useMemo<SearchValues>(() => {
    return {
      name,            
      providerType,     
      serviceCategory, 
      sortBy,
    };
  }, [name, providerType, serviceCategory, sortBy]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full mt-6">
      <div
        className="rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        style={{ backgroundColor: BRAND_SOFT }}
      >
         <Field>
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            placeholder={t("searchBar.searchByName") || "Search by name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field>
          <Search size={16} className="text-slate-400 shrink-0" />
          <select
            className="w-full bg-transparent outline-none text-sm text-slate-700"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value)}
          >
            <option value="">{t("searchBar.allDepartments")}</option>
            {providerTypes.map((p) => (
              <option key={p._id} value={p.code}>
                {pickLocalized(p.name, lang) || p.code}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <Search size={16} className="text-slate-400 shrink-0" />
          <select
            className="w-full bg-transparent outline-none text-sm text-slate-700"
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
          >
            <option value="">{t("searchBar.service")}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {pickLocalized(c.name, lang) || c.code}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <Search size={16} className="text-slate-400 shrink-0" />
          <select
            className="w-full bg-transparent outline-none text-sm text-slate-700"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">{t("sort") || "Sort by"}</option>
            {[
              { id: "nearest", key: "nearest" },
              { id: "topRated", key: "topRated" },
              { id: "newest", key: "newest" },
            ].map((opt) => (
              <option key={opt.id} value={opt.id}>
                {t(opt.key)}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="button"
          onClick={() => onSearch(values)}
          className="h-11 md:h-10 px-5 rounded-xl text-sm font-semibold whitespace-nowrap shadow-sm hover:opacity-90 transition-all"
          style={{ backgroundColor: BRAND, color: "white" }}
        >
          {t("searchBar.searchButton") || "Search"}
        </button>
      </div>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-11 md:h-10 flex-1 bg-white border border-slate-200 rounded-xl px-3 flex items-center gap-2 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]"
      style={{ ["--brand" as any]: BRAND }}
    >
      {children}
    </div>
  );
}