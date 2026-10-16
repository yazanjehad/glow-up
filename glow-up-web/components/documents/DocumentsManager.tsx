"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import PrimaryButton from "@/components/shared/PrimaryButton";
import { filesService } from "@/integration/services/files/files.service";
import { LookupsService } from "@/integration/services/provider/lookupsService";
import { pickLocalized } from "@/integration/services/provider/lookups.helpers";
import type { LookupItemDto } from "@/integration/services/provider/lookups.types";
import type { UploadedFileDto } from "@/integration/services/files/files.types";

type DocKey = string;

const ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type SavedDoc = Pick<
  UploadedFileDto,
  "url" | "blobPath" | "filename" | "mimeType" | "uploadedAt"
> & {
  documentTypeId: string;
};

type Props = {
  providerId?: string;
  storageNamespace?: string;
  onSaved?: () => void;
  className?: string;
};

function cleanProviderId(v?: string): string {
  const raw = (v || "").trim();
  return raw.replace(/"/g, "");
}

export default function DocumentsManager({
  providerId: providerIdProp,
  storageNamespace = "provider_documents",
  onSaved,
  className,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = isRTL ? "ar" : "en";

  const refs = useRef<Record<DocKey, HTMLInputElement | null>>({});

  const [docTypes, setDocTypes] = useState<LookupItemDto[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [files, setFiles] = useState<Record<DocKey, File | undefined>>({});
  const [saved, setSaved] = useState<Record<DocKey, SavedDoc | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Record<DocKey, boolean | undefined>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const providerId = useMemo(() => {
    if (providerIdProp) return cleanProviderId(providerIdProp);
    if (typeof window === "undefined") return "";
    return cleanProviderId(localStorage.getItem("providerId") || "");
  }, [providerIdProp]);

  const storageKey = useMemo(() => {
    if (!providerId) return "";
    return `${storageNamespace}:${providerId}`;
  }, [providerId, storageNamespace]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, SavedDoc>;
      setSaved(parsed || {});
    } catch {
      // ignore corrupted cache
    }
  }, [storageKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTypes(true);
        const items = await LookupsService.getByKeyFromLookupsEndpoint(
          "DOCUMENT_TYPE",
        );

        const active = (items || [])
          .filter((x) => x?.isActive !== false)
          .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

        if (alive) setDocTypes(active);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          t("admin-dashboard.documents.failedToLoad");
        if (alive) setError(msg);
      } finally {
        if (alive) setLoadingTypes(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  const selectedCount = useMemo(
    () => docTypes.filter((d) => !!files[d._id] || !!saved[d._id]).length,
    [docTypes, files, saved],
  );

  const onPick = (key: DocKey, file?: File) => {
    setError(null);
    setSuccess(null);
    if (!file) return;

    if (!ACCEPT.includes(file.type as any)) {
      setError(t("admin-dashboard.documents.unsupportedType"));
      return;
    }

    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const uploadAll = async () => {
    setError(null);
    setSuccess(null);

    if (!providerId) {
      setError(t("admin-dashboard.documents.missingProviderId"));
      return;
    }

    const entries = docTypes
      .map((d) => ({ doc: d, file: files[d._id] }))
      .filter((x) => x.file instanceof File) as Array<{
      doc: LookupItemDto;
      file: File;
    }>;

    if (entries.length === 0) {
      setError(t("admin-dashboard.documents.nothingToUpload"));
      return;
    }

    setSaving(true);
    try {
      const newlySaved: Record<string, SavedDoc> = {};

      for (const e of entries) {
        const res = await filesService.uploadFile({
          file: e.file,
          entityType: "PROVIDER",
          entityId: providerId,
          fileCategory: "document",
          meta: {
            documentTypeId: e.doc._id,
          },
        });

        newlySaved[e.doc._id] = {
          documentTypeId: e.doc._id,
          url: res.url,
          blobPath: res.blobPath,
          filename: res.filename,
          mimeType: res.mimeType,
          uploadedAt: res.uploadedAt,
        };
      }

      setSaved((prev) => {
        const next = { ...prev, ...newlySaved };
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      setFiles({});
      setSuccess(t("admin-dashboard.documents.saved"));
      onSaved?.();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || t("admin-dashboard.saveFailed");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSaved = async (docTypeId: string) => {
    setError(null);
    setSuccess(null);

    const current = saved[docTypeId];
    if (!current?.blobPath) return;

    if (!providerId) {
      setError(t("admin-dashboard.documents.missingProviderId"));
      return;
    }

    setDeleting((p) => ({ ...p, [docTypeId]: true }));
    try {
      await filesService.deleteProviderFile({
        providerId,
        fileCategory: "document",
        blobPath: current.blobPath,
      });

      setSaved((prev) => {
        const next = { ...prev };
        delete next[docTypeId];
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });

      setFiles((prev) => {
        const next = { ...prev };
        delete next[docTypeId];
        return next;
      });

      setSuccess(t("admin-dashboard.documents.deleted"));
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || t("admin-dashboard.saveFailed");
      setError(msg);
    } finally {
      setDeleting((p) => ({ ...p, [docTypeId]: false }));
    }
  };

  return (
    <div className={className ?? ""} dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900">
          {t("admin-dashboard.documents.title")}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {t("admin-dashboard.documents.subtitle")}
        </p>

        {loadingTypes ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <div className="mt-4 text-sm font-bold text-[#7AA66A]">
            {selectedCount}/{docTypes.length}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {docTypes.map((d) => {
          const f = files[d._id];
          const s = saved[d._id];
          const isDeleting = !!deleting[d._id];
          const title = pickLocalized(d.name, lang) || d.code || d._id;

          return (
            <div
              key={d._id}
              className="rounded-3xl bg-white shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-gray-800">
                  {title}
                </div>

                <input
                  ref={(el) => {
                    refs.current[d._id] = el;
                  }}
                  type="file"
                  accept={ACCEPT.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    onPick(d._id, file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => refs.current[d._id]?.click()}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  {t("admin-dashboard.documents.upload")}
                </button>
              </div>

              {(f || s) && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-500 truncate">
                    {f?.name ?? s?.filename}
                  </div>

                  {s?.blobPath && (
                    <button
                      type="button"
                      onClick={() => onDeleteSaved(d._id)}
                      disabled={isDeleting}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                        isDeleting
                          ? "border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                      }`}
                      title={t("admin-dashboard.documents.delete")}
                      aria-label={t("admin-dashboard.documents.delete")}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {t("admin-dashboard.documents.delete")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-sm font-semibold text-green-700">{success}</p>
        </div>
      )}

      <div className="mt-8">
        <PrimaryButton
          onClick={uploadAll}
          disabled={saving || loadingTypes}
          className="rounded-2xl h-14 text-base font-extrabold"
        >
          {saving ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("admin-dashboard.saving")}
            </span>
          ) : (
            t("provider.common.save")
          )}
        </PrimaryButton>
      </div>
    </div>
  );
}

