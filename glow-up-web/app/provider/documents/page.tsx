"use client";

import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import DocumentsManager from "@/components/documents/DocumentsManager";
import { useNavigationFlow } from "@/lib/useNavigationFlow";

export default function ProviderDocumentsPage() {
  const nav = useNavigationFlow();

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <HeaderProvider
        titleKey="admin-dashboard.documents.title"
        subtitleKey="admin-dashboard.documents.subtitle"
      />

      <div className="mt-6">
        <DocumentsManager onSaved={nav.goToProviderTeam} />
      </div>
    </div>
  );
}

