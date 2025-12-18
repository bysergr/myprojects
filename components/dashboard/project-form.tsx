"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Upload, X, ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { getProjectImagePath } from "@/lib/firebase-storage";
import { getProxiedImageUrl } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  techStack: z.string().optional(),
  liveUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

import { useTranslations } from "next-intl";

interface Project {
  id: string;
  title: string;
  description: string | null;
  techStack?: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  imageUrl?: string | null;
}

export function ProjectForm({
  onSuccess,
  project,
}: {
  onSuccess?: () => void;
  project?: Project | null;
}) {
  const t = useTranslations("Projects");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isEditMode = !!project;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      techStack: "",
      liveUrl: "",
      repoUrl: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title || "",
        description: project.description || "",
        techStack: project.techStack?.join(", ") || "",
        liveUrl: project.liveUrl || "",
        repoUrl: project.repoUrl || "",
        imageUrl: project.imageUrl || "",
      });
      if (project.imageUrl) {
        // Use proxied URL for existing images
        setImagePreview(getProxiedImageUrl(project.imageUrl));
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }
  }, [project, form]);

  async function handleGenerateDescription() {
    if (!user) return;

    const title = form.getValues("title");
    const techStack = form.getValues("techStack");
    const repoUrl = form.getValues("repoUrl");
    const liveUrl = form.getValues("liveUrl");

    if (!title || title.trim().length < 2) {
      toast.error("Please enter a project title first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          techStack: techStack
            ? techStack
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          repoUrl: repoUrl || undefined,
          liveUrl: liveUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error generating description");
      }

      const data = await res.json();
      console.log("Respuesta de la API de IA:", data);

      // Actualizar todos los campos con los datos generados
      if (data.title) {
        form.setValue("title", data.title, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (data.description && data.description.trim()) {
        form.setValue("description", data.description.trim(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (
        data.techStack &&
        Array.isArray(data.techStack) &&
        data.techStack.length > 0
      ) {
        form.setValue("techStack", data.techStack.join(", "), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (data.liveUrl) {
        form.setValue("liveUrl", data.liveUrl, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Forzar re-render de los campos
      form.trigger(["title", "description", "techStack", "liveUrl"]);

      const updatedFields = [];
      if (data.title) updatedFields.push("title");
      if (data.description) updatedFields.push("description");
      if (data.techStack?.length) updatedFields.push("technologies");
      if (data.liveUrl) updatedFields.push("live URL");

      if (updatedFields.length > 0) {
        toast.success(`Generated: ${updatedFields.join(", ")}`);
      } else {
        toast.error("No data was generated");
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Error generating description";
      toast.error(errorMessage);
    } finally {
      setGeneratingDescription(false);
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

      const path = getProjectImagePath(
        user.uid,
        `project-${Date.now()}-${file.name}`
      );
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
      const errorMessage =
        error instanceof Error ? error.message : "Error uploading image";
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
      const url = isEditMode ? `/api/projects/${project.id}` : "/api/projects";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          techStack: values.techStack
            ? values.techStack
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            (isEditMode ? "Error updating project" : "Error creating project")
        );
      }

      toast.success(
        isEditMode
          ? t("updated") || "Project updated successfully"
          : t("success")
      );

      if (!isEditMode) {
        form.reset();
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Project Image (Optional)</Label>
          <div className="relative h-40 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors">
            {imagePreview || form.watch("imageUrl") ? (
              <div className="relative w-full h-full">
                <img
                  src={
                    imagePreview ||
                    getProxiedImageUrl(form.watch("imageUrl")) ||
                    ""
                  }
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
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
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
              disabled={uploadingImage}
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
                <Input placeholder={t("form.titlePlaceholder")} {...field} />
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
              <div className="flex items-center justify-between">
                <FormLabel>{t("form.description")}</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={
                    generatingDescription ||
                    !form.getValues("title") ||
                    form.getValues("title").length < 2
                  }
                  className="h-8 gap-2"
                >
                  {generatingDescription ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs">Generate with AI</span>
                    </>
                  )}
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder={t("form.descriptionPlaceholder")}
                  {...field}
                  className="min-h-[100px]"
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
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Comma-separated (e.g., React, TypeScript, Node.js)
              </p>
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
                  <Input placeholder="https://..." {...field} />
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
                  <Input placeholder="https://github.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditMode
              ? t("updating") || "Updating..."
              : t("creating")
            : isEditMode
            ? t("update") || "Update"
            : t("create")}
        </Button>
      </form>
    </Form>
  );
}
