"use client";

import {
  Anchor,
  Calculator,
  CalendarClock,
  ClipboardList,
  Database,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Route,
  Ship,
  Sun,
  User
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { StoredUserProfile } from "@/lib/auth-storage";
import {
  isTripsWorkspaceNavPath,
  isVesselSofWorkspaceNavPath,
  preserveTripsWorkspaceQuery,
  preserveVesselSofWorkspaceQuery
} from "@/lib/workspace-paths";
import { cn } from "@/lib/utils";

const nav: Array<{
  path: string;
  label: string;
  icon: typeof Anchor;
  isActive?: (pathname: string) => boolean;
}> = [
  { path: "/", label: "Home", icon: Anchor },
  { path: "/vessel-sof/overview", label: "Overview", icon: LayoutDashboard },
  { path: "/vessel-sof/events", label: "Events", icon: ListChecks },
  { path: "/vessel-sof/laytime", label: "Laytime calculation", icon: Calculator },
  {
    path: "/trips",
    label: "Trips",
    icon: Route,
    isActive: (p) => p === "/trips" || p.startsWith("/trips/")
  },
  {
    path: "/vessel-calls",
    label: "Vessel calls",
    icon: CalendarClock,
    isActive: (p) => p === "/vessel-calls" || p.startsWith("/vessel-calls/")
  },
  {
    path: "/reports",
    label: "Reports",
    icon: ClipboardList,
    isActive: (p) =>
      p === "/reports" ||
      p.startsWith("/reports/") ||
      p.startsWith("/mother-vessel-reports") ||
      p === "/vessel-sof/discharge" ||
      p.startsWith("/vessel-sof/discharge/")
  },
  {
    path: "/master-data",
    label: "Master data",
    icon: Database,
    isActive: (p) => p === "/master-data" || p.startsWith("/master-data/")
  }
];

function NavLinksInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <nav className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1">
      {nav.map(({ path, label, icon: Icon, isActive }) => {
        const active = isActive
          ? isActive(pathname)
          : path === "/"
            ? pathname === "/"
            : pathname === path || pathname.startsWith(`${path}/`);
        const href = isVesselSofWorkspaceNavPath(path)
          ? preserveVesselSofWorkspaceQuery(path, searchParams)
          : isTripsWorkspaceNavPath(path)
            ? preserveTripsWorkspaceQuery(path, searchParams)
            : path;
        return (
          <Link
            key={path}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense
      fallback={
        <nav className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      }
    >
      <NavLinksInner onNavigate={onNavigate} />
    </Suspense>
  );
}

function AccountMenu({ profile }: { profile: StoredUserProfile | null }) {
  const { signOut } = useAuth();
  if (!profile) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Account menu">
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{profile.fullName}</p>
            <p className="text-xs text-muted-foreground">{profile.phone}</p>
            {profile.email ? (
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {profile.roles.slice(0, 3).join(", ")}
              {profile.roles.length > 3 ? "…" : ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={signOut}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeMenu() {
  const { setTheme, theme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Theme: light, dark, or system"
        >
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" />
          Light
          {theme === "light" ? (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" />
          Dark
          {theme === "dark" ? (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 size-4" />
          System
          {theme === "system" ? (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div data-app-shell-root className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Ship className="size-5 text-primary" />
            <span className="hidden sm:inline">VMS · SOF</span>
          </Link>

          <div className="hidden md:block">
            <NavLinks />
          </div>

          <div className="flex items-center gap-2">
            <ThemeMenu />
            {!isAuthPage ? <AccountMenu profile={profile} /> : null}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw,20rem)]">
                <SheetTitle className="mb-4 text-left text-base font-medium text-muted-foreground">
                  Menu
                </SheetTitle>
                <NavLinks onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 scroll-mt-16 px-4 pb-6 pt-8 md:pb-8 md:pt-10">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Statement of Facts · Mother &amp; lighter operations
      </footer>
    </div>
  );
}
