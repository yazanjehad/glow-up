"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X } from "lucide-react";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const mb = (b: number) => b / (1024 * 1024);
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export default function UploadImagesClient() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const nav = useNavigationFlow();
  const { images, addImage, removeImage: removeImageFromStore } = useProviderStore();

  const [activeIndex, setActiveIndex] = useState(0);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startLeft = useRef(0);

  const activeRef = useRef(0);
  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const raf = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const slideW = () => scrollRef.current?.clientWidth || 1;

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * slideW(), behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    if (raf.current) cancelAnimationFrame(raf.current);

    raf.current = requestAnimationFrame(() => {
      const w = el.clientWidth || 1;
      const raw = el.scrollLeft / w;
      const base = Math.floor(raw);
      const frac = raw - base;

      const current = activeRef.current;

      const left = clamp(base, 0, Math.max(images.length - 1, 0));
      const right = clamp(base + 1, 0, Math.max(images.length - 1, 0));

      const FORWARD = 0.58;
      const BACK = 0.42;

      let next = current;
      if (current === left && frac > FORWARD) next = right;
      else if (current === right && frac < BACK) next = left;
      else if (current !== left && current !== right)
        next = frac >= 0.5 ? right : left;

      if (next !== current) setActiveIndex(next);
    });
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) {
      alert(t("provider.uploadImages.errors.maxFiles", { max: MAX_FILES }));
      return;
    }

    for (const f of files.slice(0, remaining)) {
      if (!ACCEPT_MIME.includes(f.type as any)) {
        alert(t("provider.uploadImages.errors.type"));
        continue;
      }
      if (mb(f.size) > MAX_SIZE_MB) {
        alert(t("provider.uploadImages.errors.size", { max: MAX_SIZE_MB }));
        continue;
      }
      addImage({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }

    setActiveIndex(0);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
    );
  };

  const remove = (id: string) => {
    const img = images.find((x) => x.id === id);
    if (!img) return;

    URL.revokeObjectURL(img.previewUrl);
    removeImageFromStore(id);

    const nextIdx = Math.min(activeIndex, Math.max(images.length - 2, 0));
    setActiveIndex(nextIdx);
    requestAnimationFrame(() => scrollTo(nextIdx));
  };

  const onDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    startLeft.current = el.scrollLeft;
  };

  const onUp = () => (dragging.current = false);

  const onMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    el.scrollLeft = startLeft.current - walk;
  };

  const canNext = useMemo(() => images.length > 0, [images.length]);
  const canAdd = images.length < MAX_FILES;

  const uploadedCount = images.length;
  const counterText = `${uploadedCount}/${MAX_FILES}`; 

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <div className="px-4 pb-6">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT_MIME.join(",")}
          onChange={onPick}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!canAdd}
          className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold
            ${
              canAdd
                ? "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                : "border-gray-100 bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          <Upload className="h-4 w-4" />
          {t("provider.uploadImages.uploadBtn")}
        </button>

        <div className="mt-2 text-start text-sm font-semibold text-gray-900">
          {counterText}
        </div>

        {images.length > 0 && (
          <div className="mt-3 flex justify-center">
            <div className="w-full max-w-[520px]">
              <div
                ref={scrollRef}
                dir="ltr"
                onScroll={onScroll}
                onMouseDown={onDown}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onMouseMove={onMove}
                className="flex overflow-x-auto cursor-grab active:cursor-grabbing
                           [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="min-w-full shrink-0 snap-start relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div className="h-44 w-full bg-gray-50 sm:h-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt="Preview"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(img.id)}
                      className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow border border-gray-200"
                      aria-label={t("provider.uploadImages.remove")}
                      title={t("provider.uploadImages.remove")}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={!canNext}
            onClick={nav.goToProviderTeam}   
            className={`h-12 w-full rounded-2xl text-sm font-semibold text-white
              ${
                canNext
                  ? "bg-[#7BAE6A] hover:opacity-95"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            {t("provider.common.next")} 
          </button>

          <button
            type="button"
            onClick={nav.goToProviderTeam}  
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            {t("provider.common.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
