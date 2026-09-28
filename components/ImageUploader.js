"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

const MAX_FILES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Multi-image uploader: signs each upload via /api/upload/sign, then uploads
// directly to Cloudinary from the browser (no image bytes touch our server).
// Falls back to a plain URL input if Cloudinary isn't configured.
export default function ImageUploader({ photos, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [notConfigured, setNotConfigured] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");

  async function uploadFile(file) {
    const signRes = await fetch("/api/upload/sign", { method: "POST" });
    if (signRes.status === 503) {
      setNotConfigured(true);
      throw new Error("not_configured");
    }
    if (!signRes.ok) throw new Error("Could not start upload");
    const { signature, timestamp, apiKey, cloudName, folder, allowedFormats } = await signRes.json();

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", apiKey);
    body.append("timestamp", timestamp);
    body.append("signature", signature);
    body.append("folder", folder);
    // Must match exactly what the server signed, or Cloudinary rejects the signature.
    body.append("allowed_formats", allowedFormats);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((p) => ({ ...p, [file.name]: Math.round((e.loaded / e.total) * 100) }));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(body);
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (photos.length + files.length > MAX_FILES) {
      toast(`You can upload up to ${MAX_FILES} photos.`, "error");
      return;
    }
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast(`${file.name}: only JPG, PNG or WebP images are allowed.`, "error");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast(`${file.name}: file is larger than 5MB.`, "error");
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const url = await uploadFile(file);
        uploaded.push(url);
      }
      onChange([...photos, ...uploaded]);
      toast(`${uploaded.length} photo(s) uploaded.`, "success");
    } catch (err) {
      if (err.message !== "not_configured") {
        toast("Upload failed — please try again.", "error");
      }
    } finally {
      setUploading(false);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(idx) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  function move(idx, dir) {
    const next = [...photos];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function addFallbackUrl() {
    if (!fallbackUrl.trim()) return;
    if (photos.length >= MAX_FILES) {
      toast(`You can add up to ${MAX_FILES} photos.`, "error");
      return;
    }
    onChange([...photos, fallbackUrl.trim()]);
    setFallbackUrl("");
  }

  if (notConfigured) {
    return (
      <div>
        <p className="text-xs text-warning-600 bg-warning-50 rounded-lg px-3 py-2 mb-2">
          Direct photo upload isn&apos;t configured on this server yet (needs Cloudinary credentials) — paste a public image URL instead.
        </p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="https://..."
            aria-label="Image URL"
            value={fallbackUrl}
            onChange={(e) => setFallbackUrl(e.target.value)}
          />
          <button type="button" onClick={addFallbackUrl} className="btn-secondary btn-sm flex-none">Add</button>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-5">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || photos.length >= MAX_FILES}
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy-700 file:cursor-pointer hover:file:bg-gray-50"
      />
      <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP · up to 5MB each · up to {MAX_FILES} photos</p>

      {uploading && (
        <div className="mt-2 space-y-1">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name} className="text-xs text-gray-500">
              {name}: {pct}%
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute bottom-1 left-1 badge bg-black/60 text-white text-[10px]">Main</span>}
              <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-5">✕</button>
              <div className="absolute top-1 left-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`} className="bg-black/60 text-white rounded w-5 h-5 text-xs leading-5">←</button>}
                {i < photos.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`} className="bg-black/60 text-white rounded w-5 h-5 text-xs leading-5">→</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
