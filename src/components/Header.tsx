"use client";

import { FileText, Lock, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Chat Workspace",
    subtitle: "Ask Patricia using saved cases, imported sources, and live legal research leads.",
  },
  "/research": {
    title: "Research Engine",
    subtitle: "Search trusted East African legal sources and import readable results.",
  },
  "/cases": {
    title: "Cases",
    subtitle: "Manage document intake, library, and job queues.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "System configuration, AI providers, and storage.",
  },
};

export function Header() {
  const pathname = usePathname();
  const current = titles[pathname] || titles["/"];

  return (
    <header className="flex min-h-[64px] items-center justify-between border-b border-border bg-background px-6 sm:px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{current.title}</h1>
        <div className="hidden h-4 w-px bg-border md:block" />
        <p className="hidden text-xs font-medium text-foreground-muted md:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        
        <Link
          href="/research"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel text-foreground-muted transition-colors hover:bg-panel-elevated hover:text-foreground md:w-auto md:px-4 md:font-medium"
        >
          <Search size={14} className="md:mr-2" />
          <span className="hidden md:inline">Research</span>
        </Link>
        <Link
          href="/cases"
          className="flex h-9 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-transform hover:scale-105 active:scale-95"
        >
          <FileText size={14} />
          <span>Cases</span>
        </Link>
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel text-foreground-muted transition-colors hover:bg-panel-elevated hover:text-foreground"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  );
}
