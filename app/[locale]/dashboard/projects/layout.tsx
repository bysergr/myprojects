import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const pageUrl = `${baseUrl}/${locale}/dashboard/projects`;

  const title = locale === "es" ? "Proyectos" : "Projects";
  const description = locale === "es"
    ? "Gestiona tus proyectos y crea nuevos para tu portafolio en MyProjects."
    : "Manage your projects and create new ones for your portfolio on MyProjects.";

  return {
    title: `${title} | MyProjects`,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "MyProjects",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

