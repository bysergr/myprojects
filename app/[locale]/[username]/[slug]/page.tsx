"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ExternalLink,
  Github,
  Loader2,
  ChevronRight,
  Home,
} from "lucide-react";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/project/comments-section";
import { getProxiedImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";

interface ProjectDetailProps {
  params: Promise<{ username: string; slug: string; locale: string }>;
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
  views: number;
  user: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [locale, setLocale] = useState<string>("en");

  useEffect(() => {
    async function loadProject() {
      const { username, slug, locale: localeParam } = await params;
      setLocale(localeParam);

      // Fetch project
      const res = await fetch(`/api/public/projects/${username}/${slug}`);
      if (!res.ok) {
        notFound();
      }

      const data = await res.json();
      setProject(data);
      setLikeCount(data._count.likes);
      setLoading(false);

      // Track view
      await fetch(`/api/projects/${data.id}/view`, { method: "POST" });

      // Check if user has liked
      if (user) {
        const token = await user.getIdToken();
        const likeRes = await fetch(`/api/projects/${data.id}/like-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (likeRes.ok) {
          const { liked } = await likeRes.json();
          setLiked(liked);
        }
      }
    }

    loadProject();
  }, [params, user]);

  async function handleLike() {
    if (!user || !project) return;

    const token = await user.getIdToken();
    const res = await fetch(`/api/projects/${project.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="space-y-8">
            {/* Skeleton Breadcrumb */}
            <div className="flex items-center gap-2 px-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>

            {/* Skeleton Header */}
            <div className="space-y-4">
              <div className="h-12 w-3/4 bg-muted animate-pulse rounded-lg" />
              <div className="h-6 w-full bg-muted animate-pulse rounded-lg" />
              <div className="h-6 w-2/3 bg-muted animate-pulse rounded-lg" />
            </div>

            {/* Skeleton Image */}
            <div className="h-96 w-full bg-muted animate-pulse rounded-xl" />

            {/* Skeleton Tags */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-20 bg-muted animate-pulse rounded-full"
                />
              ))}
            </div>

            {/* Skeleton Stats */}
            <div className="h-24 w-full bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="space-y-8 md:space-y-10">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-sm px-2 pb-4"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            {project.user.username && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <Link
                  href={`/${project.user.username}`}
                  className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[200px] font-medium"
                >
                  {project.user.name || project.user.username}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span
              className="text-foreground font-semibold truncate max-w-[300px]"
              title={project.title}
            >
              {project.title}
            </span>
          </nav>

          {/* Author Info */}
          {project.user.username && (
            <div className="flex items-center gap-3 pb-6r px-2">
              <Link href={`/${project.user.username}`}>
                <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 ring-primary transition-all">
                  <AvatarImage src={project.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {project.user.name?.[0] ||
                      project.user.username?.[0] ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link
                  href={`/${project.user.username}`}
                  className="text-sm font-semibold hover:text-primary transition-colors block"
                >
                  {project.user.name || project.user.username || "Anonymous"}
                </Link>
                <p className="text-xs text-muted-foreground">Project creator</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="space-y-4 px-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                {project.description}
              </p>
            )}
            {/* Tech Stack */}
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2">
                {project.techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="px-2 py-0.5 text-xs font-normal bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image */}
          {project.imageUrl ? (
            <div className="relative group overflow-hidden rounded-2xl border-2 border-border shadow-xl bg-muted/50 p-2">
              <div className="relative overflow-hidden rounded-xl">
                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

                <img
                  src={getProxiedImageUrl(project.imageUrl)}
                  alt={project.title}
                  className="w-full h-auto max-h-[600px] object-contain transition-all duration-300 group-hover:brightness-[1.02]"
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  className="w-full min-h-[400px] max-h-[600px] flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl"
                  style={{ display: "none" }}
                >
                  <span className="text-6xl font-bold text-primary/30">
                    {project.title.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border-2 border-border shadow-xl bg-muted/50 p-2">
              <div className="w-full min-h-[400px] flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                <span className="text-6xl font-bold text-primary/30">
                  {project.title.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions Container */}
          <div className="px-2">
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {project.liveUrl && (
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold px-6"
                >
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.repoUrl && (
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className="border-2 shadow-md hover:shadow-lg transition-all hover:scale-105 font-semibold px-6 bg-background hover:bg-muted/50"
                >
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Repository
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Stats & Like */}
          <Card className="border-2 shadow-xl bg-card/50 backdrop-blur-sm mx-2 overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
                    <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {likeCount}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      likes
                    </p>
                  </div>
                </div>
              </div>

              {user && (
                <Button
                  variant={liked ? "default" : "outline"}
                  onClick={handleLike}
                  size="lg"
                  className={`w-full sm:w-auto font-semibold px-6 transition-all ${
                    liked
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                      : "border-2 shadow-md hover:shadow-lg hover:scale-105 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500/50"
                  }`}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`}
                  />
                  {liked ? "Liked" : "Like"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="pt-6 px-2">
            <CommentsSection projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
