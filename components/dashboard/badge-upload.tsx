"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { Upload, X, ImageIcon } from "lucide-react";
import { getBadgePath } from "@/lib/firebase-storage";
import { toast } from "sonner";
import { getProxiedImageUrl } from "@/lib/utils";

interface BadgeUploadProps {
  readonly currentBadgeUrl?: string | null;
  readonly onUploadComplete: (url: string) => void;
}

export function BadgeUpload({
  currentBadgeUrl,
  onUploadComplete,
}: BadgeUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(
    currentBadgeUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentBadgeUrl when it changes
  useEffect(() => {
    setPreview(currentBadgeUrl || null);
  }, [currentBadgeUrl]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB for cover images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload after preview is shown
    await handleUpload(file);
  }

  async function handleUpload(file?: File) {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !user) return;

    // Upload to Firebase Storage via API route (avoids CORS issues)
    setUploading(true);
    try {
      const path = getBadgePath(user.uid, fileToUpload.name);
      const token = await user.getIdToken();

      // Upload file via API route
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("path", path);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload file");
      }

      const { url } = await uploadRes.json();

      // Update user profile
      const profileRes = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ badgeUrl: url }),
      });

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Update preview with the actual URL from server
      setPreview(url);
      setSelectedFile(null);

      // Dispatch custom event to update other components (like dashboard)
      globalThis.dispatchEvent(
        new CustomEvent("bannerUpdated", { detail: { badgeUrl: url } })
      );

      onUploadComplete(url);
      toast.success("Cover image updated");
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload cover image";
      toast.error(errorMessage);
      setPreview(currentBadgeUrl || null);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const displayPreview =
    preview || (currentBadgeUrl ? getProxiedImageUrl(currentBadgeUrl) : null);

  return (
    <div className="space-y-4">
      {/* Preview area - always visible */}
      <label
        htmlFor="badge-upload"
        className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group bg-muted/30 block"
      >
        {displayPreview ? (
          <>
            <img
              src={displayPreview}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedFile ? "Click to upload" : "Change image"}
                </span>
              </div>
            </div>
            {/* Remove button */}
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload cover image</p>
              <p className="text-xs mt-1">Wide images (16:9) work best</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Uploading...</p>
            </div>
          </div>
        )}
      </label>

      <input
        ref={inputRef}
        id="badge-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <p className="text-xs text-muted-foreground text-center">
        Max 10MB. Wide images (16:9) work best.
      </p>
    </div>
  );
}
