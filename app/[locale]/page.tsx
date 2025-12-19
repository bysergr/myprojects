import { Navbar, Hero, ProjectsCarousel, AboutSection, Footer } from "@/components/landing";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  // Obtener la URL base del sitio
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const pageUrl = `${baseUrl}/${locale}`;

  const title = "MyProjects";
  const description = locale === "es" 
    ? "El constructor de portafolios de alta gama para desarrolladores. Muestra tus proyectos, comparte tu código y construye tu marca personal."
    : "The high-end portfolio builder for developers. Showcase your projects, share your code, and build your personal brand.";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: title,
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
  };
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProjectsCarousel />
      <AboutSection />
      <Footer />
    </main>
  );
}
