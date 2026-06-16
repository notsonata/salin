"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MonitorPlay } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    activeClass: "border-accentSoft bg-accentFaint text-accent",
    isActive: (pathname: string) =>
      pathname === "/dashboard" || pathname.startsWith("/recordings"),
  },
  {
    href: "/preview/recording",
    label: "Preview workspace",
    icon: MonitorPlay,
    activeClass: "border-reviewSoft bg-reviewFaint text-review",
    isActive: (pathname: string) => pathname.startsWith("/preview/recording"),
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-panel p-1 text-sm shadow-panel"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border px-3 font-medium transition-colors",
              active
                ? item.activeClass
                : "border-transparent text-muted hover:bg-field hover:text-ink",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
