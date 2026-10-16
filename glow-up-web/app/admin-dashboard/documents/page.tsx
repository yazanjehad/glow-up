"use client";

import DocumentsManager from "@/components/documents/DocumentsManager";

export default function DocumentsPage() {
  return (
    <div className="w-full flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-[520px]">
        <DocumentsManager />
      </div>
    </div>
  );
}

