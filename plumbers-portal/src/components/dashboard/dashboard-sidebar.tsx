"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  Home,
  Users,
  Briefcase,
  User,
  FileText,
  Calendar,
  Shield,
  MessageSquare,
  Bookmark,
  Heart,
  Star,
  BarChart3,
  ChartColumn,
  ShieldCheck,
  LayoutDashboard,
  Boxes,
  Contact,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuBadge
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/utils";

// --- THIS IS THE FIX (Part 1) ---
// Add an optional 'exact' property to our link definitions
export const allDashboardLinks: Array<{
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  exact?: boolean; // Add optional exact property
}> = [
  // General
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["customer", "tradesperson", "admin", "business_owner"],
    exact: true // This is a main index page
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    roles: ["customer", "tradesperson"]
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["customer", "tradesperson", "admin", "business_owner"]
  },

  // Customer
  {
    name: "My Jobs",
    href: "/dashboard/customer/jobs",
    icon: Briefcase,
    roles: ["customer"],
    exact: true // This is a main index page for its section
  },
  {
    name: "Quotes Received",
    href: "/dashboard/customer/quotes",
    icon: FileText,
    roles: ["customer"]
  },
  {
    name: "Favorites",
    href: "/dashboard/customer/favorites",
    icon: Heart,
    roles: ["customer"]
  },
  {
    name: "Profile",
    href: "/dashboard/customer/profile",
    icon: User,
    roles: ["customer"]
  },

  // Tradesperson (work first)
  {
    name: "Job Board",
    href: "/dashboard/tradesperson/job-board",
    icon: Briefcase,
    roles: ["tradesperson"]
  },
  {
    name: "Saved Jobs",
    href: "/dashboard/tradesperson/saved-jobs",
    icon: Bookmark,
    roles: ["tradesperson"]
  },
  {
    name: "Quotes Submitted",
    href: "/dashboard/tradesperson/my-quotes",
    icon: FileText,
    roles: ["tradesperson"]
  },
  {
    name: "My Schedule",
    href: "/dashboard/tradesperson/schedule",
    icon: Calendar,
    roles: ["tradesperson"]
  },

  // Tradesperson (insights + account)
  {
    name: "Analytics",
    href: "/dashboard/tradesperson/analytics",
    icon: BarChart3,
    roles: ["tradesperson"]
  },
  {
    name: "My Profile",
    href: "/dashboard/tradesperson/profile",
    icon: User,
    roles: ["tradesperson"]
  },

  // Admin & Business Owner
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: ChartColumn,
    roles: ["admin", "business_owner"]
  },
  {
    name: "Business Overview",
    href: "/dashboard/business-owner",
    icon: LayoutDashboard,
    roles: ["business_owner", "admin"],
    exact: true // This is a main index page for its section
  },
  {
    name: "Team Management",
    href: "/dashboard/business-owner/team",
    icon: Users,
    roles: ["business_owner", "admin"]
  },
  {
    name: "Inventory",
    href: "/dashboard/business-owner/inventory",
    icon: Boxes,
    roles: ["business_owner", "admin"]
  },
  {
    name: "Customers",
    href: "/dashboard/business-owner/customers",
    icon: Contact,
    roles: ["business_owner", "admin"]
  },
  {
    name: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: ["admin"]
  },
  {
    name: "Job Management",
    href: "/dashboard/admin/jobs",
    icon: Shield,
    roles: ["admin"]
  },
  {
    name: "Certifications",
    href: "/dashboard/admin/certifications",
    icon: ShieldCheck,
    roles: ["admin"]
  },
  {
    name: "My Profile",
    href: "/dashboard/admin/profile",
    icon: User,
    roles: ["admin"]
  }
];

interface DashboardSidebarProps {
  session: Session;
}

export function DashboardSidebar({ session }: DashboardSidebarProps) {
  const pathname = usePathname();
  const userRole = session.user?.role || "customer";
  const isTradesperson = userRole === "tradesperson";
  const isBasicTier = session.user.subscriptionTier === "basic";
  const isBusinessTier = session.user.subscriptionTier === "business";
  const [unreadMessages, setUnreadMessages] = useState(0);

  let navigation = allDashboardLinks.filter(link => link.roles.includes(userRole));

  if (isTradesperson) {
    if (isBasicTier) {
      // For Basic tier, filter out features that require Pro or higher
      navigation = navigation.filter(
        link => link.href !== "/dashboard/tradesperson/saved-jobs" && link.href !== "/dashboard/tradesperson/schedule"
      );
    }
    if (!isBusinessTier) {
      // For non-Business tiers (Basic and Pro), filter out Business-only features
      navigation = navigation.filter(link => link.href !== "/dashboard/tradesperson/analytics");
    }
  }
  useEffect(() => {
    // Only fetch for roles that can message
    if (userRole === "customer" || userRole === "tradesperson") {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/messages/unread-count");
          if (response.ok) {
            const data = await response.json();
            setUnreadMessages(data.count);
          }
        } catch (error) {
          console.error("Failed to fetch unread message count:", error);
        }
      };
      fetchUnreadCount();
    }
  }, [userRole]);

  const userInitials =
    getInitials(session.user?.name) !== "?"
      ? getInitials(session.user?.name)
      : session.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon" className="w-64 bg-background border-r border-border h-full fixed md:static z-50">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="text-foreground flex items-center gap-2">
                <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  PP
                </div>
                <span className="truncate font-semibold text-sm">Plumbers Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(item => {
                // --- THIS IS THE FIX (Part 2) ---
                // Use the new 'exact' property to determine active state
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                // --- END OF FIX ---
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors
                          ${isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"}`}>
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    </SidebarMenuButton>
                    {item.href === "/dashboard/messages" && unreadMessages > 0 && (
                      <SidebarMenuBadge>{unreadMessages}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isTradesperson && isBasicTier && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20">
                      <Star className="w-5 h-5" />
                      <span>Upgrade Plan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">
                  {userInitials}
                </div>
                <span className="truncate">{session.user?.name || session.user?.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
