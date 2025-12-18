"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/dashboard/project-form";
import { GitHubImport } from "@/components/dashboard/github-import";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderGit2, Plus, Eye, Heart, Github, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getProxiedImageUrl } from "@/lib/utils";

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  imageUrl?: string | null;
  techStack?: string[];
  published: boolean;
  views: number;
  _count: {
    likes: number;
  };
}

export default function ProjectsPage() {
  const t = useTranslations("Projects");
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [openGitHub, setOpenGitHub] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProjects(await res.json());
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, open, openGitHub, editingProject]);

  async function togglePublish(projectId: string, currentPublished: boolean) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !currentPublished }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        toast.success(updated.published ? "Published" : "Unpublished");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={openGitHub} onOpenChange={setOpenGitHub}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Github className="mr-2 h-4 w-4" /> Import from GitHub
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Projects from GitHub</DialogTitle>
                <DialogDescription>
                  Import your public GitHub repositories to your portfolio
                </DialogDescription>
              </DialogHeader>
              <GitHubImport onSuccess={() => setOpenGitHub(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> {t("add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("add")}</DialogTitle>
                <DialogDescription>
                  {t("addDescription")}
                </DialogDescription>
              </DialogHeader>
              <ProjectForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("edit") || "Edit Project"}</DialogTitle>
                <DialogDescription>
                  {t("editDescription") || "Update your project information"}
                </DialogDescription>
              </DialogHeader>
              {editingProject && (
                <ProjectForm 
                  project={editingProject}
                  onSuccess={() => {
                    setEditingProject(null);
                    fetchProjects();
                  }} 
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col h-full overflow-hidden">
            {/* Project Image */}
            <div className="relative h-40 bg-muted overflow-hidden">
              {project.imageUrl ? (
                <img
                  src={getProxiedImageUrl(project.imageUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover border-b border-border"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-4xl font-bold text-primary/30">
                    {project.title.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={project.published ? "default" : "secondary"}>
                  {project.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-3">
              <div className="flex gap-2 text-sm text-muted-foreground">
                {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="hover:underline">{t("links.live")}</a>}
                {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="hover:underline">{t("links.repo")}</a>}
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {project.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" /> {project._count.likes}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProject(project)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {t("edit") || "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(project.id, project.published)}
                    className="flex-1"
                  >
                    {project.published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FolderGit2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t("empty.title")}</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
            <Button onClick={() => setOpen(true)}>{t("add")}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
