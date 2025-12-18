"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

export function Footer() {
  const t = useTranslations("Landing");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                P
              </span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              MyProjects
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/signup"
              className="hover:text-foreground transition-colors"
            >
              {t("signup")}
            </Link>
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-border" />

          {/* Credits */}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              {t("footer.madeWith")}
              <Heart className="w-4 h-4 text-primary fill-primary" />
              {t("footer.by")}
              <a
                href="https://nodi.global"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                nodi.global
              </a>
            </p>
            <p className="text-xs">
              &copy; {currentYear} MyProjects. {t("footer.rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
