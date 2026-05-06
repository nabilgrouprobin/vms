"use client";

import {
  Building2,
  IdCard,
  MapPin,
  Package,
  Ship,
  Tags,
  Users,
  Warehouse,
  Waves
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/master-data/mother-vessels", label: "Mother vessel", icon: Ship },
  { href: "/master-data/lighters", label: "Lighter", icon: Waves },
  { href: "/master-data/sof-event-types", label: "SOF event types", icon: Tags },
  { href: "/master-data/products", label: "Products", icon: Package },
  { href: "/master-data/locations", label: "Locations", icon: MapPin },
  { href: "/master-data/organizations", label: "Organizations", icon: Building2 },
  { href: "/master-data/organization-types", label: "Organization types", icon: IdCard },
  { href: "/master-data/ghats", label: "Ghats", icon: Warehouse },
  { href: "/master-data/users", label: "Users & roles", icon: Users }
] as const;

export function MasterDataShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start">
      <aside className="w-full shrink-0 md:w-56">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Master files
          </p>
          <nav className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
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
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
