"use client";

import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  titleKey: string;          
  subtitleKey?: string;     
  subtitle?: ReactNode;     
  className?: string;
};

export default function PageTitle({
  titleKey,
  subtitleKey,
  subtitle,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={["text-center", className].filter(Boolean).join(" ")}>
      <h1 className="text-2xl font-extrabold text-gray-900">{t(titleKey)}</h1>

      {subtitleKey ? (
        <p className="mt-2 text-sm leading-6 text-gray-600">{t(subtitleKey)}</p>
      ) : subtitle ? (
        <p className="mt-2 text-sm leading-6 text-gray-600">{subtitle}</p>
      ) : null}
    </div>
  );
}
