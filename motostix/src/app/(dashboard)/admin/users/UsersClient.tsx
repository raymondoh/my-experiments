"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ListUsersResult, UserProfile } from "@/lib/services/users";
import { DataTable } from "@/components/admin/DataTable";
import type { PageChangeMeta } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableToolbar, type TableDensity } from "@/components/admin/TableToolbar";
import { createUserColumns } from "./users-columns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;

type UsersClientProps = {
  initial: ListUsersResult;
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export function UsersClient({ initial }: UsersClientProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<UserProfile[]>(initial.items);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initial.nextCursor ?? null);
  const [cursorStack, setCursorStack] = React.useState<(string | null)[]>([null]);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"any" | "admin" | "user">("any");
  const [density, setDensity] = React.useState<TableDensity>("comfortable");
  const [isLoading, setIsLoading] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deletingUser, setDeletingUser] = React.useState<UserProfile | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const initialLoadRef = React.useRef(true);

  const fetchPage = React.useCallback(
    async (cursor: string | null, meta: { direction?: PageChangeMeta["direction"] } = {}) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        if (cursor) {
          params.set("cursor", cursor);
        }
        if (debouncedSearch) {
          params.set("q", debouncedSearch);
        }
        if (roleFilter && roleFilter !== "any") {
          params.set("role", roleFilter);
        }

        const response = await fetch(`/api/users?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ListUsersResult;
        setRows(payload.items);
        setNextCursor(payload.nextCursor ?? null);
        setCursorStack(prev => {
          if (meta.direction === "next") {
            return cursor != null ? [...prev, cursor] : prev;
          }
          if (meta.direction === "previous") {
            return prev.length > 1 ? prev.slice(0, -1) : prev;
          }
          if (meta.direction === "reset") {
            return [null];
          }
          return prev;
        });
      } catch (error) {
        console.error("Failed to load users", error);
        toast.error("Failed to load users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, roleFilter],
  );

  React.useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    void fetchPage(null, { direction: "reset" });
  }, [debouncedSearch, roleFilter, fetchPage]);

  const handlePageChange = React.useCallback(
    (cursor: string | null, meta?: PageChangeMeta) => {
      if (meta?.direction === "next") {
        if (!cursor) {
          return;
        }
        void fetchPage(cursor, { direction: "next" });
        return;
      }

      if (meta?.direction === "previous") {
        if (cursorStack.length <= 1) {
          return;
        }
        void fetchPage(cursor, { direction: "previous" });
      }
    },
    [cursorStack.length, fetchPage],
  );

  const previousCursor = cursorStack.length > 1 ? cursorStack[cursorStack.length - 2] ?? null : undefined;

  const totalHint = React.useMemo(() => {
    if (rows.length === 0) {
      return "No users found";
    }
    if (nextCursor) {
      return `${rows.length} users loaded (more available)`;
    }
    return `Showing ${rows.length} users`;
  }, [rows.length, nextCursor]);

  const openEdit = React.useCallback((user: UserProfile) => {
    setEditingUser(user);
    setIsEditOpen(true);
  }, []);

  const openDelete = React.useCallback((user: UserProfile) => {
    setDeletingUser(user);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteDialog = React.useCallback(() => {
    setIsDeleteOpen(false);
    setDeletingUser(null);
  }, []);

  const handleDeleteConfirmed = React.useCallback(() => {
    if (!deletingUser) {
      return;
    }
    toast.info("TODO: Implement user deletion endpoint");
    setIsDeleteOpen(false);
    setDeletingUser(null);
  }, [deletingUser]);

  const columns = React.useMemo(
    () =>
      createUserColumns({
        onView: user => router.push(`/admin/users/${user.id}`),
        onEdit: openEdit,
        onDelete: openDelete,
      }),
    [router, openEdit, openDelete],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        nextCursor={nextCursor ?? undefined}
        previousCursor={previousCursor}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        density={density}
        emptyState={<EmptyState title="No users found" description="Try a different search or role filter." />}
        totalHint={totalHint}
        toolbar={() => (
          <TableToolbar
            searchPlaceholder="Search users"
            searchValue={search}
            onSearchChange={setSearch}
            filterLabel="Role"
            filterValue={roleFilter}
            onFilterChange={value => setRoleFilter(value as "any" | "admin" | "user")}
            filterOptions={[
              { label: "All roles", value: "any" },
              { label: "Admins", value: "admin" },
              { label: "Users", value: "user" },
            ]}
            density={density}
            onDensityChange={setDensity}
          />
        )}
      />

      <Sheet
        open={isEditOpen}
        onOpenChange={open => {
          setIsEditOpen(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>
              TODO: Implement editing for <span className="font-semibold">{editingUser?.name ?? editingUser?.email}</span>.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>This is a placeholder form. Hook up your user editor here.</p>
            <div className="rounded-md border p-4">
              <p className="font-medium text-foreground">User summary</p>
              <p>Name: {editingUser?.name ?? "Unknown"}</p>
              <p>Email: {editingUser?.email ?? "—"}</p>
              <p>Role: {editingUser?.role ?? "user"}</p>
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled>Save changes</Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={open => {
          setIsDeleteOpen(open);
          if (!open) {
            setDeletingUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              TODO: Wire this up to your delete endpoint for {deletingUser?.email ?? deletingUser?.name ?? "this user"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
