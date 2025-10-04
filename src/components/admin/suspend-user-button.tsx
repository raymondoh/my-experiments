"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import type { User } from "@/lib/types/user";

export function SuspendUserButton({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  const handleSuspend = async () => {
    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, disabled: !user.disabled })
      });
      if (!response.ok) {
        throw new Error("Failed to update user status");
      }
      toast.success(`User ${user.disabled ? "unsuspended" : "suspended"} successfully`);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 font-normal h-auto">
          <Ban className="mr-2 h-4 w-4" />
          {user.disabled ? "Unsuspend" : "Suspend"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            You are about to {user.disabled ? "unsuspend" : "suspend"} the user {user.email}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleSuspend}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
