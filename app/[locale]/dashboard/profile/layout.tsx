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
  const pageUrl = `${baseUrl}/${locale}/dashboard/profile`;

  const title = locale === "es" ? "Perfil" : "Profile";
  const description = locale === "es"
    ? "Edita tu perfil y configura tu información personal en MyProjects."
    : "Edit your profile and configure your personal information on MyProjects.";

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

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

