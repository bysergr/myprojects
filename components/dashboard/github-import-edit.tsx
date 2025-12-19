"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { X, ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProjectImagePath } from "@/lib/firebase-storage";
import { getProxiedImageUrl } from "@/lib/utils";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  techStack: z.string().optional(),
  liveUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

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

interface GitHubImportEditProps {
  repo: GitHubRepo;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GitHubImportEdit({ repo, onSuccess, onCancel }: GitHubImportEditProps) {
  const t = useTranslations("Projects");
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [extractingOG, setExtractingOG] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract technologies from topics and language
  const initialTechStack = [
    ...(repo.topics || []),
    ...(repo.language ? [repo.language] : [])
  ].filter(Boolean).join(", ");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: repo.name,
      description: repo.description || "",
      techStack: initialTechStack,
      liveUrl: repo.homepage || "",
      repoUrl: repo.html_url,
      imageUrl: "",
    },
  });

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
  async function extractOpenGraphImage(url: string) {
    if (!url || isGitHubUrl(url)) return;
    
    setExtractingOG(true);
    try {
      const response = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          form.setValue("imageUrl", data.imageUrl, { shouldValidate: true, shouldDirty: true });
          console.log("Imagen de Open Graph extraída:", data.imageUrl);
        }
      }
    } catch (error) {
      console.error("Error extrayendo imagen de Open Graph:", error);
      // No mostrar error al usuario, es opcional
    } finally {
      setExtractingOG(false);
    }
  }

  // Llamar a la IA automáticamente cuando se monta el componente
  useEffect(() => {
    if (user && repo.html_url) {
      generateProjectData();
    }
  }, [user, repo.html_url]);

  // Observar cambios en liveUrl
  const liveUrl = useWatch({
    control: form.control,
    name: "liveUrl",
  });

  // Extraer imagen de Open Graph cuando hay un liveUrl que no sea de GitHub
  useEffect(() => {
    if (liveUrl && !isGitHubUrl(liveUrl)) {
      // Esperar un poco para que el usuario termine de editar
      const timeoutId = setTimeout(() => {
        extractOpenGraphImage(liveUrl);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [liveUrl]);

  async function generateProjectData() {
    if (!user) return;
    
    setGeneratingAI(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: repo.name,
          techStack: initialTechStack ? initialTechStack.split(',').map(s => s.trim()).filter(Boolean) : [],
          repoUrl: repo.html_url,
          liveUrl: repo.homepage || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error generating project data:", errorData);
        return; // Continuar con valores por defecto si falla
      }

      const data = await res.json();
      console.log("Datos generados por IA:", data);
      
      // Actualizar el formulario con los datos generados
      if (data.title) {
        form.setValue("title", data.title, { shouldValidate: true, shouldDirty: true });
      }
      if (data.description) {
        form.setValue("description", data.description, { shouldValidate: true, shouldDirty: true });
      }
      if (data.techStack && Array.isArray(data.techStack) && data.techStack.length > 0) {
        form.setValue("techStack", data.techStack.join(", "), { shouldValidate: true, shouldDirty: true });
      }
      if (data.liveUrl) {
        form.setValue("liveUrl", data.liveUrl, { shouldValidate: true, shouldDirty: true });
      }
      
      // Si hay un liveUrl que no sea de GitHub, intentar extraer la imagen de Open Graph
      const finalLiveUrl = data.liveUrl || repo.homepage;
      if (finalLiveUrl && !isGitHubUrl(finalLiveUrl)) {
        extractOpenGraphImage(finalLiveUrl);
      }
    } catch (error) {
      console.error("Error generating project data:", error);
      // Continuar con valores por defecto si hay error
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const path = getProjectImagePath(user.uid, `project-${Date.now()}-${file.name}`);
      const token = await user.getIdToken();

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
        throw new Error(errorData.error || "Error uploading image");
      }

      const { url } = await uploadRes.json();
      form.setValue("imageUrl", url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error uploading image";
      toast.error(errorMessage);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          techStack: values.techStack ? values.techStack.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error creating project");
      }
      
      toast.success(t("success"));
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : t("error");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const isProcessing = generatingAI || extractingOG;

  return (
    <Form {...form}>
      {/* Modal de carga */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-lg" 
          style={{ zIndex: 100 }}
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">
            {generatingAI ? "Generando detalles del proyecto con IA" : "Extrayendo imagen del sitio web"}
          </DialogTitle>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
            </div>
            <div className="text-center space-y-3">
              {generatingAI && (
                <>
                  <h3 className="text-lg font-semibold text-foreground">
                    🤖 Generando detalles del proyecto con IA
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Extrayendo título, descripción, tecnologías y URL en vivo del repositorio
                  </p>
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </>
              )}
              {extractingOG && !generatingAI && (
                <>
                  <h3 className="text-lg font-semibold text-foreground">
                    🖼️ Extrayendo imagen del sitio web
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Obteniendo imagen de Open Graph desde la URL en vivo
                  </p>
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de edición - oculto cuando está procesando */}
      <div className={isProcessing ? "hidden" : ""}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Project Image (Optional)</Label>
          <div className="relative h-40 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors">
            {imagePreview || form.watch("imageUrl") ? (
              <div className="relative w-full h-full">
                <img
                  src={imagePreview || getProxiedImageUrl(form.watch("imageUrl")) || ""}
                  alt="Preview"
                  className="w-full h-full object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    form.setValue("imageUrl", "");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={isProcessing}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground ${
                  isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm">Click to upload an image</span>
                <span className="text-xs">Max 5MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage || isProcessing}
            />
          </div>
          {uploadingImage && (
            <p className="text-xs text-muted-foreground">Uploading image...</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.title")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("form.titlePlaceholder")} 
                  {...field} 
                  disabled={isProcessing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.description")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t("form.descriptionPlaceholder")} 
                  {...field} 
                  disabled={isProcessing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="techStack"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.techStack")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("form.techStackPlaceholder")} 
                  {...field} 
                  disabled={isProcessing}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">Comma-separated (e.g., React, TypeScript, Node.js)</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="liveUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.liveUrl")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://..." 
                    {...field} 
                    disabled={isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.repoUrl")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://github.com/..." 
                    {...field} 
                    disabled={isProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading || isProcessing}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || isProcessing}
          >
            {isLoading ? t("creating") : "Import Project"}
          </Button>
        </div>
      </form>
      </div>
    </Form>
  );
}

