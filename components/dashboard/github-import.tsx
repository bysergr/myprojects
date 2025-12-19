"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Github, Loader2, AlertCircle, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GitHubImportEdit } from "@/components/dashboard/github-import-edit";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  created_at: string;
  updated_at: string;
}

// Función para extraer el username de GitHub de una URL
function extractGitHubUsername(githubUrl: string | null | undefined): string | null {
  if (!githubUrl) return null;
  
  try {
    const url = new URL(githubUrl);
    // Extraer el pathname y eliminar el slash inicial
    const pathname = url.pathname.replace(/^\//, "");
    // Obtener la primera parte del path (el username)
    const username = pathname.split("/")[0];
    return username || null;
  } catch {
    // Si no es una URL válida, intentar extraer el username directamente
    const match = githubUrl.match(/github\.com\/([^\/\s]+)/);
    return match ? match[1] : null;
  }
}

export function GitHubImport({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("Projects");
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [editingRepo, setEditingRepo] = useState<GitHubRepo | null>(null);
  const [importedRepoUrls, setImportedRepoUrls] = useState<Set<string>>(new Set());

  // Obtener el perfil del usuario y hacer prefill del username si tiene githubUrl
  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return;
      
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.githubUrl) {
            const extractedUsername = extractGitHubUsername(data.githubUrl);
            if (extractedUsername) {
              setUsername(extractedUsername);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        // No mostrar error al usuario, es opcional
      }
    }

    loadUserProfile();
  }, [user]);

  async function fetchRepos() {
    if (!username.trim()) {
      toast.error("Please enter a GitHub username");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      // Obtener repositorios de GitHub
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("GitHub user not found");
        } else {
          toast.error("Error loading repositories");
        }
        setRepos([]);
        return;
      }

      const data = await response.json();
      
      // Obtener proyectos ya importados del usuario
      if (user) {
        const token = await user.getIdToken();
        const projectsRes = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (projectsRes.ok) {
          const projects: Array<{ repoUrl: string | null }> = await projectsRes.json();
          
          // Crear un Set con los repoUrl de los proyectos ya importados
          const importedUrls = new Set(
            projects
              .map(p => p.repoUrl)
              .filter((url): url is string => url !== null && url !== undefined)
          );
          
          setImportedRepoUrls(importedUrls);
          setRepos(data);
          
          if (data.length === 0) {
            toast.info("This user has no public repositories");
          }
        } else {
          setRepos(data);
        }
      } else {
        setRepos(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to GitHub");
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }

  function handleImportClick(repo: GitHubRepo) {
    setEditingRepo(repo);
  }

  function handleImportSuccess() {
    if (editingRepo) {
      setImported(prev => new Set([...prev, editingRepo.full_name]));
      // Marcar el repo como importado
      setImportedRepoUrls(prev => new Set([...prev, editingRepo.html_url]));
    }
    setEditingRepo(null);
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 500);
    }
    router.refresh();
  }

  function handleImportCancel() {
    setEditingRepo(null);
  }

  // Función para verificar si una URL es de GitHub
  function isGitHubUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === "github.com" || urlObj.hostname === "www.github.com";
    } catch {
      return false;
    }
  }

  // Función para extraer imagen de Open Graph
  async function extractOpenGraphImage(url: string): Promise<string | null> {
    if (!url || isGitHubUrl(url)) return null;
    
    try {
      const response = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.imageUrl || null;
      }
    } catch (error) {
      console.error("Error extrayendo imagen de Open Graph:", error);
    }
    
    return null;
  }

  async function handleImportAll() {
    if (!user || repos.length === 0) return;
    
    // Filtrar solo los repositorios que no están importados
    const reposToImport = repos.filter(repo => !importedRepoUrls.has(repo.html_url));
    
    if (reposToImport.length === 0) {
      toast.info("All repositories have already been imported");
      return;
    }
    
    setImportingAll(true);
    const token = await user.getIdToken();
    let successCount = 0;
    let errorCount = 0;

    for (const repo of reposToImport) {
      try {
        // Preparar datos del proyecto
        const initialTechStack = [
          ...(repo.topics || []),
          ...(repo.language ? [repo.language] : [])
        ].filter(Boolean).join(", ");

        // Intentar extraer imagen de Open Graph si hay un liveUrl que no sea de GitHub
        let imageUrl = "";
        if (repo.homepage && !isGitHubUrl(repo.homepage)) {
          const ogImage = await extractOpenGraphImage(repo.homepage);
          if (ogImage) {
            imageUrl = ogImage;
          }
        }

        const projectData = {
          title: repo.name,
          description: repo.description || "",
          techStack: initialTechStack.split(',').map(s => s.trim()).filter(Boolean),
          liveUrl: repo.homepage || "",
          repoUrl: repo.html_url,
          imageUrl,
        };

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(projectData),
        });

        if (res.ok) {
          successCount++;
          // Marcar como importado
          setImportedRepoUrls(prev => new Set([...prev, repo.html_url]));
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error importing ${repo.name}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} project${successCount > 1 ? 's' : ''}`);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
      router.refresh();
    }

    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} project${errorCount > 1 ? 's' : ''}`);
    }

    setImportingAll(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="github-username">GitHub Username</Label>
        <div className="flex gap-2">
          <Input
            id="github-username"
            placeholder="your-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchRepos();
              }
            }}
          />
          <Button 
            onClick={fetchRepos} 
            disabled={loading || !username.trim()}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your GitHub username to view your public repositories
        </p>
      </div>

      {repos.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Label>
              Repositories ({repos.length})
              {importedRepoUrls.size > 0 && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({repos.filter(repo => !importedRepoUrls.has(repo.html_url)).length} available)
                </span>
              )}
            </Label>
            <Button
              size="sm"
              variant="default"
              onClick={handleImportAll}
              disabled={importingAll || repos.filter(repo => !importedRepoUrls.has(repo.html_url)).length === 0}
            >
              {importingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import All
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            {repos.map((repo) => {
              const isImported = importedRepoUrls.has(repo.html_url);
              return (
                <div
                  key={repo.id}
                  className={`flex items-start justify-between gap-3 p-3 border rounded-lg transition-colors ${
                    isImported 
                      ? "bg-muted/30 opacity-60" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium text-sm truncate">{repo.name}</h4>
                      {repo.language && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {repo.stargazers_count > 0 && (
                        <span>⭐ {repo.stargazers_count}</span>
                      )}
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {repo.topics.slice(0, 3).map((topic) => (
                            <span key={topic} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isImported ? (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Previously imported</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImportClick(repo)}
                        disabled={importing === repo.full_name || importingAll}
                      >
                        {importing === repo.full_name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Import"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {repos.length === 0 && !loading && username && hasSearched && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No repositories found. Make sure the username is correct.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      {editingRepo && (
        <Dialog open={!!editingRepo} onOpenChange={(open) => !open && handleImportCancel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project Details</DialogTitle>
              <DialogDescription>
                Review and edit the project information before importing
              </DialogDescription>
            </DialogHeader>
            <GitHubImportEdit
              repo={editingRepo}
              onSuccess={handleImportSuccess}
              onCancel={handleImportCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

