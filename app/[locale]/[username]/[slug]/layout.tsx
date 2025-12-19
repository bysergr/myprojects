import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string; locale: string }>;
}): Promise<Metadata> {
  const { username, slug, locale } = await params;

  const project = await prisma.project.findFirst({
    where: {
      slug,
      published: true,
      user: { username },
    },
    select: {
      title: true,
      description: true,
      imageUrl: true,
      techStack: true,
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  if (!project) {
    return {
      title: "Proyecto no encontrado",
      description: "El proyecto que buscas no existe.",
    };
  }

  // Obtener la URL base del sitio
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const pageUrl = `${baseUrl}/${locale}/${username}/${slug}`;

  // La imagen de Open Graph se genera automáticamente por Next.js desde opengraph-image.tsx
  const ogImageUrl = `${baseUrl}/${locale}/${username}/${slug}/opengraph-image`;

  const title = project.title;
  const description =
    project.description && project.description.length > 0
      ? project.description.length > 160
        ? `${project.description.substring(0, 160)}...`
        : project.description
      : `${project.title} por ${project.user.name || project.user.username}`;

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
          alt: title,
        },
      ],
      locale: locale,
      type: "article",
      authors: [project.user.name || project.user.username || ""],
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

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

