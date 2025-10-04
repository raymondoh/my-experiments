// src/components/layout/navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { User, UserPlus, LogOut, Wrench, Menu, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/notification-bell";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";

interface NavbarProps {
  session: Session | null;
}

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { data: clientSession } = useSession();
  const currentSession = clientSession ?? session ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseNavigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Pricing", href: "/pricing" }
  ];

  const getProfileLink = (role?: string) => {
    if (role === "customer") return "/dashboard/customer/profile";
    if (role === "tradesperson") return "/dashboard/tradesperson/profile";
    if (role === "admin") return "/dashboard/admin/profile";
    return null;
  };
  const profileLink = getProfileLink(currentSession?.user?.role);

  const getInitials = () => {
    if (currentSession?.user?.name) {
      return currentSession.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return currentSession?.user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (!mounted) {
    // Skeleton loader to prevent layout shift
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Base Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-primary" />

            <span className="hidden md:inline-block text-xl font-bold">Plumbers Portal</span>
          </Link>

          <div data-testid="base-nav" className="hidden md:flex space-x-1">
            {baseNavigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                )}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Auth buttons or User Menu */}
        <div className="flex items-center space-x-2">
          {currentSession?.user ? (
            // User is logged in
            <div className="flex items-center space-x-2" data-testid="nav-auth-area">
              {/* ⬇️ NEW: persistent tier badge for tradespeople */}
              {currentSession.user.role === "tradesperson" && (
                <SubscriptionBadge
                  tier={(currentSession.user.subscriptionTier ?? "basic") as "basic" | "pro" | "business"}
                />
              )}

              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* --- THIS IS THE FIX --- */}
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentSession.user.image ?? ""} alt={currentSession.user.name ?? ""} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{currentSession.user.name}</p>
                    <p className="text-xs text-muted-foreground">{currentSession.user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {profileLink && (
                    <DropdownMenuItem asChild>
                      <Link href={profileLink}>
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {baseNavigation.map(item => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="px-3 py-2">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // User is logged out
            <>
              {/* CHANGE 3: sm -> md */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Link
                  href="/register"
                  className="flex items-center w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-sm font-medium px-3 py-1.5">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
              {/* Mobile menu */}
              {/* CHANGE 4: sm -> md */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 [&>svg]:!size-8" aria-label="Open menu">
                      <Menu strokeWidth={1.75} />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56 bg-background">
                    {baseNavigation.map(item => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="px-3 py-2">
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="px-3 py-2">
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/register"
                        className="flex items-center w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm text-sm font-medium px-3 py-2">
                        <UserPlus className="mr-2 h-4 w-4 text-gray-800" />
                        <span>Sign Up</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
