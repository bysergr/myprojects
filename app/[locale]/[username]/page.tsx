import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProxiedImageUrl } from "@/lib/utils";
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Link,
  Heart,
  Eye,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Link as I18nLink } from "@/i18n/navigation";

type CustomLink = {
  label: string;
  url: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; locale: string }>;
}): Promise<Metadata> {
  const { username, locale } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      badgeUrl: true,
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!user) {
    return {
      title: "Usuario no encontrado",
      description: "El perfil de usuario que buscas no existe.",
    };
  }

  // Obtener la URL base del sitio
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const pageUrl = `${baseUrl}/${locale}/${username}`;

  // La imagen de Open Graph se genera automáticamente por Next.js desde opengraph-image.tsx
  const ogImageUrl = `${baseUrl}/${locale}/${username}/opengraph-image`;

  const title = user.name || user.username || "Perfil de Usuario";
  const description =
    user.bio ||
    `Portafolio de ${user.name || user.username}. ${user._count.projects} ${
      user._count.projects === 1 ? "proyecto" : "proyectos"
    } publicados.`;

  return {
    title: `${title} | MyProjects`,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "MyProjects",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.name || user.username} - Perfil`,
        },
      ],
      locale: locale,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string; locale: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      projects: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { likes: true },
          },
        },
      },
    },
  });

  if (!user) notFound();

  // Type assertion for customLinks since Prisma Json type is not properly inferred
  const userWithCustomLinks = user as typeof user & {
    customLinks: CustomLink[] | null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-48 bg-muted">
        {user.badgeUrl && (
          <img
            src={getProxiedImageUrl(user.badgeUrl)}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.avatarUrl || ""} />
            <AvatarFallback>
              {user.name?.[0] || user.username?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="container mx-auto px-8 pt-20 pb-8">
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="text-muted-foreground">@{user.username}</p>
        {user.bio && <p className="mt-4 max-w-2xl">{user.bio}</p>}

        {/* Social Links */}
        {(() => {
          const customLinks = (userWithCustomLinks.customLinks ||
            []) as CustomLink[];
          const hasLinks =
            user.githubUrl ||
            user.linkedinUrl ||
            user.twitterUrl ||
            user.websiteUrl ||
            customLinks.length > 0;

          if (!hasLinks) return null;

          return (
            <div className="mt-4 flex flex-wrap gap-3">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {user.twitterUrl && (
                <a
                  href={user.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {user.websiteUrl && (
                <a
                  href={user.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {/* Custom Links */}
              {customLinks.map((link) => (
                <a
                  key={`${link.url}-${link.label}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  <Link className="h-4 w-4" />
                  {link.label}
                </a>
              ))}
            </div>
          );
        })()}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {user.projects.map((project) => (
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
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/90 text-primary-foreground">
                  Publicado
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
                  {project.techStack && project.techStack.length > 0 && (
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
                          title="Ver en vivo"
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
                          title="Ver repositorio"
                        >
                          <Code2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                      {project.slug && (
                        <I18nLink
                          href={`/${username}/${project.slug}`}
                          className="p-1.5 hover:bg-muted rounded-md transition-colors"
                          title="Ver proyecto"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </I18nLink>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
