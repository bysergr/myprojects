import { Navbar, Hero, ProjectsCarousel, AboutSection, Footer } from "@/components/landing";

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
