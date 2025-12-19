"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { getAvatarPath } from "@/lib/firebase-storage";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(
    currentAvatarUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentAvatarUrl changes
  useEffect(() => {
    setPreview(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Firebase Storage via API route (avoids CORS issues)
    setUploading(true);
    try {
      // Add timeout to prevent infinite loading
      const uploadPromise = (async () => {
        const path = getAvatarPath(user.uid, file.name);
        const token = await user.getIdToken();

        // Upload file via API route
        const formData = new FormData();
        formData.append("file", file);
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
        console.log("Uploaded file, received URL:", url);

        // Update user profile
        const profileRes = await fetch("/api/user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: url }),
        });

        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to update profile");
        }

        const updatedUser = await profileRes.json();
        console.log("Profile updated, avatarUrl in DB:", updatedUser.avatarUrl);

        return url;
      })();

      // 30 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Upload timeout. Please try again.")),
          30000
        );
      });

      const url = await Promise.race([uploadPromise, timeoutPromise]);

      // Update preview with the actual URL from server
      setPreview(url);

      // Notify parent component
      onUploadComplete(url);

      // Dispatch custom event to update other components (like dashboard)
      window.dispatchEvent(
        new CustomEvent("avatarUpdated", { detail: { avatarUrl: url } })
      );

      toast.success("Avatar updated");

      // Reset file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload avatar";
      toast.error(errorMessage);
      setPreview(currentAvatarUrl || null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-28 w-28">
        <AvatarImage src={preview || ""} />
        <AvatarFallback>{user?.displayName?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <label htmlFor="avatar-upload">
          <Button asChild disabled={uploading}>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Avatar"}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          Max 5MB. Square images work best.
        </p>
      </div>
    </div>
  );
}
