"use client";

import { useEffect, useRef, useState } from "react";

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Gallery({ photos, title }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const openButtonRef = useRef(null);
  const dialogRef = useRef(null);

  // Focus trap: move focus into the dialog on open, cycle Tab/Shift+Tab within it,
  // and restore focus to the trigger button on close (handled in closeLightbox).
  useEffect(() => {
    if (!lightbox) return;
    const closeBtn = dialogRef.current?.querySelector('[aria-label="Close"]');
    closeBtn?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightbox, photos?.length]);

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-video bg-navy-50 rounded-xl overflow-hidden flex items-center justify-center text-navy-300">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
        </svg>
      </div>
    );
  }

  function next() {
    setIndex((i) => (i + 1) % photos.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }
  function closeLightbox() {
    setLightbox(false);
    openButtonRef.current?.focus();
  }
  function onTouchEnd(e) {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 50) prev();
    else if (dx < -50) next();
    setTouchStartX(null);
  }

  return (
    <div>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setLightbox(true)}
        className="aspect-video bg-navy-50 rounded-xl overflow-hidden block w-full"
        aria-label="Open photo fullscreen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[index]} alt={title} className="w-full h-full object-cover" />
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              aria-current={i === index}
              className={`flex-none w-16 h-12 rounded-md overflow-hidden border-2 ${i === index ? "border-brand-500" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — photo ${index + 1} of ${photos.length}`}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 sm:left-6 text-white text-3xl w-10 h-10 flex items-center justify-center"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[index]}
            alt={title}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 sm:right-6 text-white text-3xl w-10 h-10 flex items-center justify-center"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
