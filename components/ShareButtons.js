"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function ShareButtons({ title }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied.", "success");
    } catch {
      toast("Could not copy — select the URL manually.", "error");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // user cancelled the share sheet — not an error
    }
  }

  if (!url) return null;

  return (
    <div className="flex items-center gap-2 mt-3">
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className="btn-secondary btn-sm">
          Share
        </button>
      )}
      <button type="button" onClick={copyLink} className="btn-secondary btn-sm">
        Copy Link
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary btn-sm"
      >
        WhatsApp
      </a>
    </div>
  );
}
