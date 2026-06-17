"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Waveform,
  Books,
  List,
  CloudArrowUp,
} from "@phosphor-icons/react";

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
    icon: CloudArrowUp,
    label: "Upload",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/library",
    icon: Books,
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
              "h-10 justify-start gap-3 px-3 transition-all",
              active
                ? "bg-accent text-panel hover:bg-accent/90"
                : "border-transparent bg-transparent text-muted hover:bg-stone-100 hover:text-ink",
            )}
            key={item.href}
            variant="ghost"
          >
            <Link href={item.href}>
              <Icon weight={active ? "fill" : "bold"} className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
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
    <div className="min-h-screen bg-canvas bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="mx-auto flex min-h-screen max-w-[1500px] gap-4 px-3 py-3 sm:px-4 lg:px-5">
        <aside className="hidden w-[15.5rem] shrink-0 lg:block">
          <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[1.35rem] border border-line bg-panel shadow-sm">
            <div className="border-b border-line px-5 py-5">
              <Link className="inline-flex items-center gap-3 group" href="/">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-900 shadow-sm transition-transform group-hover:scale-105">
                  <span className="font-serif text-xl font-bold">S</span>
                </span>
                <span className="grid gap-0.5">
                  <span className="font-serif text-2xl text-ink tracking-tight pt-1">
                    Salin
                  </span>
                </span>
              </Link>
            </div>

            <ScrollArea className="flex-1 overscroll-none">
              <div className="grid gap-8 px-4 py-5">
                <div className="grid gap-3">
                  <p className="px-3 font-sans font-semibold text-[10px] uppercase tracking-[0.18em] text-muted">
                    Dashboard
                  </p>
                  <SidebarLinks pathname={pathname} />
                </div>
              </div>
            </ScrollArea>
          </div>
        </aside>

        <div className="min-w-0 flex-1 relative bg-panel rounded-[1.35rem] border border-line shadow-sm overflow-hidden flex flex-col">
          <header className="mb-4 flex items-center justify-between border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:hidden sticky top-0 z-10">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-stone-100 text-stone-900 shadow-sm">
                <span className="font-serif text-lg font-bold">S</span>
              </span>
              <span className="font-serif text-xl text-ink tracking-tight pt-0.5">
                Salin
              </span>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button aria-label="Open navigation" size="icon" variant="ghost">
                  <List weight="bold" className="h-5 w-5 text-ink" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[22rem]" side="left">
                <SheetHeader>
                  <SheetTitle className="text-left font-serif text-2xl">Salin</SheetTitle>
                  <SheetDescription className="text-left">
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

          <main className="flex-1 h-full overflow-auto">
            <div className="h-full p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
