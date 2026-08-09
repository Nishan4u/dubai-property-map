"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X, ZoomIn, ZoomOut } from "lucide-react";

export interface GalleryImage {
  url: string;
  name: string;
}

export interface GallerySection {
  label: string;
  images: GalleryImage[];
}

const SLIDESHOW_INTERVAL_MS = 3500;

export function GalleryLightbox({ sections }: { sections: GallerySection[] }) {
  const flat = useMemo(() => sections.flatMap((s) => s.images), [sections]);
  const offsets = useMemo(() => {
    // Built via reduce (each step returns a new running total, nothing
    // reassigned) rather than a mutated `let` counter -- the same
    // cumulative-offset result without a variable that gets reassigned
    // across iterations.
    const result: number[] = [];
    sections.reduce((total, s) => {
      result.push(total);
      return total + s.images.length;
    }, 0);
    return result;
  }, [sections]);

  const [index, setIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function open(i: number) {
    setIndex(i);
    setZoomed(false);
  }
  function close() {
    setIndex(null);
    setPlaying(false);
    setZoomed(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  function next() {
    setZoomed(false);
    setIndex((i) => (i === null || flat.length === 0 ? i : (i + 1) % flat.length));
  }
  function prev() {
    setZoomed(false);
    setIndex((i) => (i === null || flat.length === 0 ? i : (i - 1 + flat.length) % flat.length));
  }
  function toggleFullscreen() {
    if (!overlayRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      overlayRef.current.requestFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, flat.length]);

  useEffect(() => {
    if (!playing || index === null || flat.length <= 1) return;
    const id = setInterval(next, SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, flat.length]);

  const active = index !== null ? flat[index] : null;

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIdx) =>
        section.images.length === 0 ? null : (
          <div key={section.label}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {section.label}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {section.images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => open(offsets[sectionIdx] + i)}
                  className="block h-24 overflow-hidden rounded-lg border border-navy-700 bg-navy-850"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {active && (
        <div
          ref={overlayRef}
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col bg-navy-950/97 backdrop-blur-sm"
        >
          <div
            className="flex items-center justify-between px-4 py-3 text-ink-200"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs tabular-nums text-ink-400">
              {(index ?? 0) + 1} / {flat.length}
            </span>
            <div className="flex items-center gap-1">
              {flat.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  title={playing ? "Pause slideshow" : "Play slideshow"}
                  className="rounded-lg p-2 hover:bg-navy-800 hover:text-gold-400"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                title={zoomed ? "Zoom out" : "Zoom in"}
                className="rounded-lg p-2 hover:bg-navy-800 hover:text-gold-400"
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Toggle fullscreen"
                className="rounded-lg p-2 hover:bg-navy-800 hover:text-gold-400"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={close}
                title="Close"
                className="rounded-lg p-2 hover:bg-navy-800 hover:text-rose-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {flat.length > 1 && (
              <button
                type="button"
                onClick={prev}
                title="Previous"
                className="absolute left-2 z-10 rounded-full bg-navy-900/80 p-2 text-ink-200 hover:text-gold-400 sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.name}
              onClick={() => setZoomed((z) => !z)}
              className={clsx(
                "max-h-full max-w-full object-contain transition-transform duration-200",
                zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
              )}
            />
            {flat.length > 1 && (
              <button
                type="button"
                onClick={next}
                title="Next"
                className="absolute right-2 z-10 rounded-full bg-navy-900/80 p-2 text-ink-200 hover:text-gold-400 sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
