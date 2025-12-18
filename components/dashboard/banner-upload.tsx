"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, ImageIcon } from "lucide-react";
import { getBadgePath } from "@/lib/firebase-storage";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BannerUploadProps {
  currentBannerUrl?: string | null;
  onUploadComplete: (url: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BannerUpload({ 
  currentBannerUrl, 
  onUploadComplete, 
  open, 
  onOpenChange 
}: BannerUploadProps) {
  const t = useTranslations("DashboardPreview");
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidFileType"));
      return;
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const path = getBadgePath(user.uid, `banner-${Date.now()}-${selectedFile.name}`);
      const token = await user.getIdToken();

      // Upload file via API route
      const formData = new FormData();
      formData.append("file", selectedFile);
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

      // Dispatch custom event to update other components (like dashboard)
      window.dispatchEvent(new CustomEvent('bannerUpdated', { detail: { badgeUrl: url } }));

      onUploadComplete(url);
      toast.success(t("bannerUpdated"));
      handleClose();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : t("uploadError");
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setPreview(null);
    setSelectedFile(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("uploadBanner")}</DialogTitle>
          <DialogDescription>{t("uploadBannerDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area */}
          <div 
            className="relative h-40 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            {preview || currentBannerUrl ? (
              <img
                src={preview || currentBannerUrl || ""}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm">{t("clickToSelect")}</span>
              </div>
            )}

            {/* Clear button */}
            {preview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          <p className="text-xs text-muted-foreground text-center">
            {t("bannerHint")}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              {t("cancel")}
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  {t("uploading")}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("saveBanner")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



