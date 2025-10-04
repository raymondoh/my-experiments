// src/components/auth/role-guard.tsx
"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { hasRole, hasMinimumRole, type UserRole } from "@/lib/auth/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  role?: UserRole;
  minimumRole?: UserRole;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({ children, role, minimumRole, fallback = null, showFallback = false }: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return showFallback ? fallback : null;
  }

  // Not authenticated
  if (!session?.user) {
    return showFallback ? fallback : null;
  }

  const userRole = session.user?.role;

  // Check specific role
  if (role && !hasRole(userRole, role)) {
    return showFallback ? fallback : null;
  }

  // Check minimum role
  if (minimumRole && !hasMinimumRole(userRole, minimumRole)) {
    return showFallback ? fallback : null;
  }

  return <>{children}</>;
}
