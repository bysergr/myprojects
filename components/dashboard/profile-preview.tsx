"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Pencil, Share2, Eye, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getProxiedImageUrl } from "@/lib/utils";

interface User {
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  badgeUrl: string | null;
}

interface ProfilePreviewProps {
  user: User;
  onBannerClick: () => void;
}

export function ProfilePreview({ user, onBannerClick }: ProfilePreviewProps) {
  const t = useTranslations("DashboardPreview");
  const locale = useLocale();

  const handleShare = async () => {
    if (!user.username) {
      toast.error(t("noUsername"));
      return;
    }

    const profileUrl = `${window.location.origin}/${locale}/${user.username}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyError"));
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card">
      {/* Preview indicator */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {t("previewMode")}
        </span>
      </div>

      {/* Banner */}
      <div
        className="relative h-32 sm:h-40 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 cursor-pointer group"
        onClick={onBannerClick}
      >
        {user.badgeUrl ? (
          <img
            src={getProxiedImageUrl(user.badgeUrl)}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-6 h-6 text-primary" />
            </div>
          </div>
        )}

        {/* Edit overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
            <Pencil className="w-4 h-4" />
            <span className="text-sm font-medium">{t("changeBanner")}</span>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-6 pb-6">
        {/* Avatar - positioned to overlap banner */}
        <div className="relative -mt-12 sm:-mt-14 mb-4">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-card">
            <AvatarImage src={user.avatarUrl || ""} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {user.name?.[0] || user.username?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User details */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {user.name || t("noName")}
            </h1>
            {user.username ? (
              <p className="text-muted-foreground">@{user.username}</p>
            ) : (
              <p className="text-muted-foreground/50 italic">
                {t("noUsernameSet")}
              </p>
            )}
          </div>

          {user.bio ? (
            <p className="text-foreground/80 max-w-2xl">{user.bio}</p>
          ) : (
            <p className="text-muted-foreground/50 italic">{t("noBio")}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" />
                {t("editProfile")}
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              {t("shareProfile")}
            </Button>
            {user.username && (
              <Link href={`/${user.username}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("viewPublic")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
