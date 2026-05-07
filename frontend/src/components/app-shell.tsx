"use client";

import {
  Anchor,
  Calculator,
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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { clearSession, getUserProfile, type StoredUserProfile } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

const nav: Array<{
  href: string;
  label: string;
  icon: typeof Anchor;
  isActive?: (pathname: string) => boolean;
}> = [
  { href: "/", label: "Home", icon: Anchor },
  { href: "/vessel-sof/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/vessel-sof/events", label: "Events", icon: ListChecks },
  { href: "/vessel-sof/laytime", label: "Laytime calculation", icon: Calculator },
  {
    href: "/trips",
    label: "Trips",
    icon: Route,
    isActive: (p) => p === "/trips" || p.startsWith("/trips/")
  },
  {
    href: "/reports",
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
    href: "/master-data",
    label: "Master data",
    icon: Database,
    isActive: (p) => p === "/master-data" || p.startsWith("/master-data/")
  }
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1">
      {nav.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive
          ? isActive(pathname)
          : href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
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

function AccountMenu({ profile }: { profile: StoredUserProfile | null }) {
  const router = useRouter();
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
          onClick={() => {
            clearSession();
            router.replace("/login");
            router.refresh();
          }}
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
  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    setProfile(getUserProfile());
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
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
