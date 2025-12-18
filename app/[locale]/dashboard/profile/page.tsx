"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { BadgeUpload } from "@/components/dashboard/badge-upload";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const {user} = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched profile data:", { avatarUrl: data.avatarUrl, badgeUrl: data.badgeUrl });
        setAvatarUrl(data.avatarUrl || null);
        setBadgeUrl(data.badgeUrl || null);
      }
    }
    fetchProfile();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Avatar Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload 
            currentAvatarUrl={avatarUrl}
            onUploadComplete={setAvatarUrl}
          />
        </CardContent>
      </Card>

      {/* Cover Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeUpload 
            currentBadgeUrl={badgeUrl}
            onUploadComplete={setBadgeUrl}
          />
        </CardContent>
      </Card>

      {/* Profile Form */}
      <ProfileForm />
    </div>
  );
}
