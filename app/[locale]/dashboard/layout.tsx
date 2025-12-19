import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthGuard } from "@/components/dashboard/auth-guard";
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
  const pageUrl = `${baseUrl}/${locale}/dashboard`;

  const title = locale === "es" ? "Panel" : "Dashboard";
  const description = locale === "es"
    ? "Gestiona tu portafolio y proyectos desde tu panel de control en MyProjects."
    : "Manage your portfolio and projects from your MyProjects dashboard.";

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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
