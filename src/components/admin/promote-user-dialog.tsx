"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import type { User, UserRole } from "@/lib/types/user";

export function PromoteUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [newRole, setNewRole] = useState(user.role);

  const handlePromote = async () => {
    try {
      const response = await fetch("/api/admin/promote-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newRole })
      });
      if (!response.ok) {
        throw new Error("Failed to promote user");
      }
      toast.success("User role updated successfully");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 font-normal h-auto">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>Changing role for {user.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as UserRole)}
            className="w-full p-2 border rounded">
            <option value="customer">Customer</option>
            <option value="tradesperson">Tradesperson</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handlePromote}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
