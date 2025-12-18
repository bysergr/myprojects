"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Eye,
  ExternalLink,
  Code2,
  Plus,
  FolderGit2,
} from "lucide-react";
import { getProxiedImageUrl } from "@/lib/utils";

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

interface ProjectsGridProps {
  projects: Project[];
  username: string | null;
}

export function ProjectsGrid({ projects, username }: ProjectsGridProps) {
  const t = useTranslations("DashboardPreview");

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderGit2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t("noProjects")}</h3>
            <p className="text-muted-foreground max-w-sm">
              {t("noProjectsDesc")}
            </p>
          </div>
          <Link href="/dashboard/projects">
            <Button className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              {t("addFirstProject")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("myProjects")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("projectsCount", { count: projects.length })}
          </p>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t("addProject")}
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="group overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col h-full"
          >
            {/* Project image */}
            <div className="relative h-40 bg-muted overflow-hidden">
              {project.imageUrl ? (
                <img
                  src={getProxiedImageUrl(project.imageUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover border-b border-border transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-4xl font-bold text-primary/30">
                    {project.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Published badge */}
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                  project.published
                    ? "bg-primary/90 text-primary-foreground"
                    : "bg-muted-foreground/90 text-white"
                }`}
              >
                {project.published ? t("published") : t("draft")}
              </div>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                {project.title}
              </CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="flex flex-col flex-1 space-y-4">
              <div className="flex flex-col gap-3 mt-auto">
                {/* Tech stack */}
                {project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats and links */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{project._count.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">{project.views}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title={t("viewLive")}
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title={t("viewRepo")}
                      >
                        <Code2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    {username && project.published && (
                      <Link
                        href={`/${username}/${project.slug}`}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title={t("viewProject")}
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
