// src/components/dashboard/dashboard-header.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { User, LogOut, Wrench, LayoutDashboard, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import NotificationBell from "@/components/notifications/notification-bell";
import SubscriptionBadge from "@/components/subscriptions/subscription-badge";
import { useMediaQuery } from "@/hooks/use-media-query";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function DashboardHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const segments = pathname.split("/").filter(Boolean);

  const getProfileLink = (role?: string) => {
    if (role === "customer") return "/dashboard/customer/profile";
    if (role === "tradesperson") return "/dashboard/tradesperson/profile";
    if (role === "admin") return "/dashboard/admin/profile";
    return null;
  };
  const profileLink = getProfileLink(session?.user?.role);

  const { displayName, displayEmail, avatarImage, avatarFallback } = useMemo(() => {
    const nameFromSession = session?.user?.name?.trim();
    const emailFromSession = session?.user?.email ?? "";

    const fallbackInitials = nameFromSession
      ? getInitials(nameFromSession)
      : emailFromSession?.[0]?.toUpperCase() ?? "U";

    return {
      displayName:
        nameFromSession ||
        emailFromSession?.split("@")[0]?.replace(/\./g, " ")?.trim() ||
        "Account",
      displayEmail: emailFromSession || undefined,
      avatarImage: session?.user?.image ?? null,
      avatarFallback: fallbackInitials || "U"
    };
  }, [session?.user?.email, session?.user?.image, session?.user?.name]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <Link href="/" className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block font-bold">Plumbers Portal</span>
        </Link>
      </div>

      <div className="flex-1">
        {!isMobile && (
          <Breadcrumb className="hidden md:flex ml-4">
            <BreadcrumbList>
              {segments.length > 0 && (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {segments.slice(1).map((segment, index) => {
                const isLast = index === segments.length - 2;
                const href = `/${segments.slice(0, index + 2).join("/")}`;
                return (
                  <React.Fragment key={href}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{capitalize(segment.replace(/-/g, " "))}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{capitalize(segment.replace(/-/g, " "))}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-2">
        {session?.user.role === "tradesperson" && (
          <SubscriptionBadge tier={(session.user.subscriptionTier ?? "basic") as "basic" | "pro" | "business"} />
        )}
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarImage ?? undefined} alt={displayName} />
                <AvatarFallback className="text-sm font-semibold uppercase">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background" align="end">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{displayName}</p>
              {displayEmail ? <p className="text-xs text-muted-foreground">{displayEmail}</p> : null}
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
            <DropdownMenuItem asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Homepage
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
