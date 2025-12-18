"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth-provider";
import { ProfilePreview } from "@/components/dashboard/profile-preview";
import { ProjectsGrid } from "@/components/dashboard/projects-grid";
import { BannerUpload } from "@/components/dashboard/banner-upload";

interface User {
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  badgeUrl: string | null;
}

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  techStack: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  published: boolean;
  views: number;
  _count: {
    likes: number;
  };
}

export default function DashboardPage() {
  const t = useTranslations("DashboardPreview");
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!authUser) return;

      try {
        const token = await authUser.getIdToken();

        // Fetch user profile and projects in parallel
        const [userRes, projectsRes] = await Promise.all([
          fetch("/api/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/projects", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (userRes.ok) {
          const user = await userRes.json();
          setUserData(user);
        }

        if (projectsRes.ok) {
          const projectsList = await projectsRes.json();
          setProjects(projectsList);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Listen for avatar and banner updates from other pages
    const handleAvatarUpdate = (event: CustomEvent) => {
      setUserData(prev => prev ? { ...prev, avatarUrl: event.detail.avatarUrl } : null);
    };

    const handleBannerUpdate = (event: CustomEvent) => {
      setUserData(prev => prev ? { ...prev, badgeUrl: event.detail.badgeUrl } : null);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('bannerUpdated', handleBannerUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('bannerUpdated', handleBannerUpdate as EventListener);
    };
  }, [authUser]);

  const handleBannerUpdate = (url: string) => {
    setUserData(prev => prev ? { ...prev, badgeUrl: url } : null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for profile preview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="h-8 bg-muted animate-pulse" />
          <div className="h-40 bg-muted animate-pulse" />
          <div className="p-6 space-y-4">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 rounded-full bg-muted animate-pulse -mt-14" />
              <div className="flex-1 space-y-2">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        {/* Skeleton for projects */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="h-40 bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Preview */}
      <ProfilePreview 
        user={userData} 
        onBannerClick={() => setBannerDialogOpen(true)}
      />

      {/* Projects Grid */}
      <ProjectsGrid 
        projects={projects} 
        username={userData.username}
      />

      {/* Banner Upload Dialog */}
      <BannerUpload
        currentBannerUrl={userData.badgeUrl}
        onUploadComplete={handleBannerUpdate}
        open={bannerDialogOpen}
        onOpenChange={setBannerDialogOpen}
      />
    </div>
  );
}
