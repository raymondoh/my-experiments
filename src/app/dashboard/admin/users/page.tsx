"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPaginatedUsers } from "@/lib/services/user/actions";
import type { User } from "@/lib/types/user";
import { UserTable } from "@/components/admin/user-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, User as UserIcon, CheckCircle } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass = "text-primary"
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    </CardContent>
  </Card>
);

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const searchParams = useSearchParams();

  const PAGE_SIZE = 6;

  const fetchInitialUsers = async () => {
    setIsLoading(true);
    try {
      const { users, lastVisibleId: newCursor, totalUserCount: total } = await getPaginatedUsers({ limit: PAGE_SIZE });
      setAllUsers(users);
      setLastVisibleId(newCursor);
      setTotalUserCount(total);
      setHasMore(newCursor !== null);
    } catch (error) {
      console.error("Failed to fetch initial users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialUsers();
  }, [searchParams]);

  const handleLoadMore = async () => {
    if (!lastVisibleId || !hasMore || isMoreLoading) return;
    setIsMoreLoading(true);
    try {
      const { users: newUsers, lastVisibleId: newCursor } = await getPaginatedUsers({
        limit: PAGE_SIZE,
        lastVisibleId
      });
      setAllUsers(prevUsers => [...prevUsers, ...newUsers]);
      setLastVisibleId(newCursor);
      setHasMore(newCursor !== null);
    } catch (error) {
      console.error("Failed to load more users:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const adminCount = totalUserCount > 0 ? allUsers.filter(u => u.role === "admin").length : 0;
  const tradespersonCount = totalUserCount > 0 ? allUsers.filter(u => u.role === "tradesperson").length : 0;
  const customerCount = totalUserCount > 0 ? allUsers.filter(u => u.role === "customer").length : 0;
  const verifiedCount = totalUserCount > 0 ? allUsers.filter(u => u.emailVerified).length : 0;

  // --- THIS IS THE FIX ---
  // The <main> tag with padding has been replaced with a simple <div>.
  // The padding is now controlled by the parent layout.tsx for consistency.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">View, manage, and promote users on the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Admins" value={adminCount} icon={Shield} colorClass="text-red-600" />
        <StatCard title="Tradespeople" value={tradespersonCount} icon={Users} colorClass="text-orange-600" />
        <StatCard title="Customers" value={customerCount} icon={UserIcon} colorClass="text-blue-600" />
        <StatCard title="Verified Emails" value={verifiedCount} icon={CheckCircle} colorClass="text-green-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {isLoading ? "Loading user data..." : `Showing ${allUsers.length} of ${totalUserCount} users.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <UserTable users={allUsers} />
              <div className="mt-6 flex flex-col items-center gap-2">
                {hasMore ? (
                  <Button onClick={handleLoadMore} disabled={isMoreLoading}>
                    {isMoreLoading ? "Loading..." : "Load More"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No more users to load.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
