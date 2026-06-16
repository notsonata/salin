"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AudioLines,
  House,
  LibraryBig,
  Menu,
  PanelRightOpen,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/dashboard",
    icon: Upload,
    label: "Dashboard",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/library",
    icon: LibraryBig,
    label: "Library",
    match: (pathname: string) => pathname.startsWith("/library"),
  },
];

function SidebarLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Primary" className="grid gap-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Button
            asChild
            className={cn(
              "h-10 justify-start gap-3 px-3",
              active
                ? "bg-accent text-panel hover:bg-accent/90"
                : "border-transparent bg-transparent text-muted hover:bg-hover hover:text-ink",
            )}
            key={item.href}
            variant="ghost"
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1500px] gap-4 px-3 py-3 sm:px-4 lg:px-5">
        <aside className="hidden w-[15.5rem] shrink-0 lg:block">
          <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[1.35rem] border border-line/80 bg-panel/96 shadow-panel backdrop-blur">
            <div className="border-b border-line/80 px-5 py-5">
              <Link className="inline-flex items-center gap-3" href="/">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-accentSoft bg-accentFaint text-accent">
                  <AudioLines className="h-4 w-4" />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-lg font-semibold tracking-[-0.03em] text-ink">
                    Salin
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    Transcript console
                  </span>
                </span>
              </Link>
            </div>

            <ScrollArea className="flex-1 overscroll-none">
              <div className="grid gap-8 px-4 py-5">
                <div className="grid gap-3">
                  <p className="px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    Workspace
                  </p>
                  <SidebarLinks pathname={pathname} />
                </div>


              </div>
            </ScrollArea>


          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between rounded-[1.2rem] border border-line/80 bg-panel/96 px-4 py-3 shadow-panel backdrop-blur lg:hidden">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-accentSoft bg-accentFaint text-accent">
                <AudioLines className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-[-0.03em] text-ink">
                Salin
              </span>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button aria-label="Open navigation" size="icon" variant="secondary">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[22rem]" side="left">
                <SheetHeader>
                  <SheetTitle>Salin</SheetTitle>
                  <SheetDescription>
                    Transcript-first review for uploaded Tagalog, English, and Taglish
                    recordings.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8 grid gap-8">
                  <SidebarLinks pathname={pathname} />

                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
