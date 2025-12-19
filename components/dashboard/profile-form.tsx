"use client";

import { useEffect, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Plus,
  Trash2,
  Link,
} from "lucide-react";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2),
  bio: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

type CustomLink = {
  label: string;
  url: string;
};

const MAX_CUSTOM_LINKS = 6;

export function ProfileForm() {
  const t = useTranslations("Profile");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      name: "",
      bio: "",
      githubUrl: "",
      linkedinUrl: "",
      twitterUrl: "",
      websiteUrl: "",
    },
  });

  useEffect(() => {
    async function fetchProfile() {
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
          form.reset({
            username: data.username || "",
            name: data.name || "",
            bio: data.bio || "",
            githubUrl: data.githubUrl || "",
            linkedinUrl: data.linkedinUrl || "",
            twitterUrl: data.twitterUrl || "",
            websiteUrl: data.websiteUrl || "",
          });
          // Load custom links
          if (data.customLinks && Array.isArray(data.customLinks)) {
            setCustomLinks(data.customLinks);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error(t("loadError"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user, form]);

  const addCustomLink = () => {
    if (customLinks.length >= MAX_CUSTOM_LINKS) return;
    setCustomLinks([...customLinks, { label: "", url: "" }]);
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const updateCustomLink = (
    index: number,
    field: keyof CustomLink,
    value: string
  ) => {
    const updated = [...customLinks];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLinks(updated);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    // Filter out empty custom links
    const validCustomLinks = customLinks.filter(
      (link) => link.label.trim() && link.url.trim()
    );

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          customLinks: validCustomLinks,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(t("success"));
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    }
  }

  if (isLoading) return <div>{t("loading")}</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>{t("basicInfo")}</CardTitle>
              <CardDescription>{t("basicInfoDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("username")}</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("name")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bio")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("bioPlaceholder")}
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>{t("socialLinks")}</CardTitle>
              <CardDescription>{t("socialLinksDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter / X
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://twitter.com/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t("website")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://mywebsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Links Section */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{t("customLinks")}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("customLinksDescription", { max: MAX_CUSTOM_LINKS })}
                    </p>
                  </div>
                  {customLinks.length < MAX_CUSTOM_LINKS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomLink}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {t("addLink")}
                    </Button>
                  )}
                </div>

                {customLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder={t("linkLabel")}
                        value={link.label}
                        onChange={(e) =>
                          updateCustomLink(index, "label", e.target.value)
                        }
                        className="h-9"
                      />
                      <Input
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) =>
                          updateCustomLink(index, "url", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomLink(index)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {customLinks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    {t("noCustomLinks")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Button type="submit">{t("save")}</Button>
      </form>
    </Form>
  );
}
