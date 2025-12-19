import { LoginForm } from "@/components/auth/login-form";
import { Navbar } from "@/components/landing";
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
  const pageUrl = `${baseUrl}/${locale}/login`;

  const title = locale === "es" ? "Iniciar Sesión" : "Log In";
  const description = locale === "es"
    ? "Inicia sesión en MyProjects para acceder a tu portafolio y gestionar tus proyectos."
    : "Log in to MyProjects to access your portfolio and manage your projects.";

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

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen w-full items-center justify-center px-4 pt-16">
        <LoginForm />
      </div>
    </div>
  );
}
