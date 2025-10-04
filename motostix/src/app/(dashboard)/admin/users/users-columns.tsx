import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import type { UserProfile } from "@/lib/services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface UserColumnHandlers {
  onView?: (user: UserProfile) => void;
  onEdit?: (user: UserProfile) => void;
  onDelete?: (user: UserProfile) => void;
}

dayjs.extend(relativeTime);

const formatRelative = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return "—";
  }
  return parsed.fromNow();
};

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name || email || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return source.slice(0, 2).toUpperCase();
  }
  const initials = parts.slice(0, 2).map(part => part[0]).join("");
  return initials.toUpperCase();
};

const roleVariant: Record<string, "default" | "outline" | "secondary"> = {
  admin: "default",
  user: "secondary",
};

export const createUserColumns = (
  handlers: UserColumnHandlers = {},
): ColumnDef<UserProfile>[] => [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email ?? "User"} />
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user.name ?? "Unknown"}</span>
            <span className="text-xs text-muted-foreground">{user.email ?? "—"}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.email;
      return email ? (
        <Link href={`mailto:${email}`} className="text-sm text-primary hover:underline">
          {email}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role ?? "user";
      const variant = roleVariant[role] ?? "outline";
      return <Badge variant={variant}>{role}</Badge>;
    },
  },
  {
    accessorKey: "createdAtISO",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAtISO;
      if (!createdAt) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const formatted = formatRelative(createdAt);
      return (
        <span className="text-sm text-muted-foreground" title={dayjs(createdAt).format("MMM D, YYYY HH:mm")}>
          {formatted}
        </span>
      );
    },
  },
  {
    accessorKey: "lastLoginAtISO",
    header: "Last Login",
    cell: ({ row }) => {
      const lastLogin = row.original.lastLoginAtISO ?? row.original.updatedAtISO;
      if (!lastLogin) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <span className="text-sm text-muted-foreground" title={dayjs(lastLogin).format("MMM D, YYYY HH:mm")}>
          {formatRelative(lastLogin)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => handlers.onView?.(user)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlers.onEdit?.(user)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handlers.onDelete?.(user)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
