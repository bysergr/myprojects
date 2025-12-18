"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { locales } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  className?: string;
  variant?: "default" | "sidebar";
}

export function LocaleSwitcher({ className, variant = "default" }: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Locale");
  const [isChanging, setIsChanging] = useState(false);
  const [changingLocale, setChangingLocale] = useState<string | null>(null);

  const localeNames: Record<string, string> = {
    en: t("english"),
    es: t("spanish"),
  };

  const handleLocaleChange = (newLocale: string) => {
    // Si ya estamos en ese locale, no hacer nada
    if (newLocale === locale || isChanging) {
      return;
    }
    
    // Activar estado de loading
    setIsChanging(true);
    setChangingLocale(newLocale);
    
    // usePathname() de next-intl ya devuelve el pathname sin el locale
    // Por ejemplo: si estás en /en/dashboard, pathname será /dashboard
    const currentPath = pathname || '/';
    
    // Construir la nueva URL con el nuevo locale
    const newPath = `/${newLocale}${currentPath === '/' ? '' : currentPath}`;
    
    // Agregar query params y hash si existen
    const search = window.location.search;
    const hash = window.location.hash;
    const fullPath = `${newPath}${search}${hash}`;
    
    // Pequeño delay para mostrar el loading antes de cambiar
    setTimeout(() => {
      // Usar window.location para cambiar la URL correctamente
      // Esto causará una recarga de la página con el nuevo locale
      window.location.href = fullPath;
    }, 150);
  };

  const isSidebar = variant === "sidebar";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2",
              isSidebar && "w-full justify-start",
              className
            )}
            title={t("changeLanguage")}
            disabled={isChanging}
          >
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className={isSidebar ? "" : "hidden sm:inline"}>
              {isChanging ? t("changing") : (localeNames[locale] || locale)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isSidebar ? "start" : "end"}>
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onSelect={(e) => {
                e.preventDefault();
                handleLocaleChange(loc);
              }}
              className={cn(
                locale === loc && "bg-accent",
                isChanging && "opacity-50 cursor-not-allowed"
              )}
              disabled={isChanging || loc === locale}
            >
              <div className="flex items-center gap-2 w-full">
                {changingLocale === loc ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="w-4" />
                )}
                <span className="flex-1">{localeNames[loc]}</span>
                {locale === loc && !isChanging && <span>✓</span>}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Overlay de loading cuando está cambiando */}
      {isChanging && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("changing")}</p>
          </div>
        </div>
      )}
    </>
  );
}

