"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard, Megaphone, Users, FileText, Briefcase, DollarSign,
  Bell, BarChart2, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface AppShellProps {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  brandNav?: NavItem[];
  creatorNav?: NavItem[];
}

const BRAND_NAV: NavItem[] = [
  { label: "Dashboard",    href: "/brand/dashboard",       icon: LayoutDashboard },
  { label: "Campaigns",    href: "/brand/campaigns",       icon: Megaphone },
  { label: "Applications", href: "/brand/applications",    icon: Users },
  { label: "Collaborations", href: "/brand/collaborations", icon: Briefcase },
  { label: "Reports",      href: "/brand/reports",         icon: BarChart2 },
];

const CREATOR_NAV: NavItem[] = [
  { label: "Dashboard",    href: "/creator/dashboard",     icon: LayoutDashboard },
  { label: "Browse",       href: "/creator/browse",        icon: Megaphone },
  { label: "Applications", href: "/creator/applications",  icon: FileText },
  { label: "Collaborations", href: "/creator/collaborations", icon: Briefcase },
  { label: "Portfolio",    href: "/creator/portfolio",     icon: Users },
  { label: "Earnings",     href: "/creator/earnings",      icon: DollarSign },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCreator = user.role === "CREATOR";
  const nav = isCreator ? CREATOR_NAV : BRAND_NAV;
  const roleLabel = isCreator ? "Creator" : "Brand";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
          <span className="text-sidebar-accent-foreground font-bold text-sm">CL</span>
        </div>
        <span className="text-sidebar-foreground font-bold text-lg tracking-tight">CreatorLink</span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Role label */}
      <div className="px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-sidebar-muted">{roleLabel} Portal</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-border hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Notifications & bottom actions */}
      <div className="p-2 space-y-0.5">
        <Link
          href={isCreator ? "/creator/notifications" : "/brand/notifications"}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-muted hover:bg-sidebar-border hover:text-sidebar-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User info */}
      <div className="p-4 flex items-center gap-3">
        <UserAvatar name={user.name} image={user.image} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name ?? "User"}</p>
          <p className="text-xs text-sidebar-muted truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sidebar-muted hover:text-destructive hover:bg-destructive-muted"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
