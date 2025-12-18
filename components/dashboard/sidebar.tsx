"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, User, FolderGit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Dashboard");
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: t("title"), icon: LayoutDashboard },
    { href: "/dashboard/projects", label: t("projects"), icon: FolderGit2 },
    { href: "/dashboard/profile", label: t("profile"), icon: User },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-6 font-semibold">
        MyProjects
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === link.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-2">
        <LocaleSwitcher variant="sidebar" />
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
