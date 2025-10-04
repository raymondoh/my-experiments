"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { UserProfile } from "@/lib/services/users";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createUserAction, updateUserAction } from "./actions";
import {
  createUserSchema,
  type CreateUserInput,
} from "./user-schemas";

type UserDialogBaseProps = {
  trigger?: React.ReactNode;
  className?: string;
  onSuccess?: (options?: { reset?: boolean }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type CreateUserDialogProps = UserDialogBaseProps & {
  mode: "create";
  initialData?: Partial<UserProfile>;
};

type EditUserDialogProps = UserDialogBaseProps & {
  mode: "edit";
  initialData: UserProfile;
};

type UserDialogProps = CreateUserDialogProps | EditUserDialogProps;

type UserFormValues = CreateUserInput;

const createEmptyValues = (): UserFormValues => ({
  name: undefined,
  email: "",
  image: undefined,
  role: "user",
});

export function UserDialog(props: UserDialogProps) {
  const { mode, trigger, className, onSuccess, onOpenChange } = props;
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;

  const defaultValues = React.useMemo<UserFormValues>(() => {
    if (mode === "edit") {
      return {
        name: props.initialData.name ?? undefined,
        email: props.initialData.email ?? "",
        image: props.initialData.image ?? undefined,
        role: props.initialData.role ?? "user",
      };
    }

    if (props.initialData) {
      return {
        name: props.initialData.name ?? undefined,
        email: props.initialData.email ?? "",
        image: props.initialData.image ?? undefined,
        role: props.initialData.role ?? "user",
      };
    }

    return createEmptyValues();
  }, [mode, props.initialData]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setFormError(null);
    }
  }, [open, defaultValues, form]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      if (!nextOpen) {
        form.reset(defaultValues);
        setFormError(null);
      }
      onOpenChange?.(nextOpen);
    },
    [defaultValues, form, isControlled, onOpenChange],
  );

  const submitLabel = mode === "create" ? "Create user" : "Save changes";
  const dialogTitle = mode === "create" ? "Add user" : "Edit user";
  const dialogDescription =
    mode === "create"
      ? "Invite a new team member or update their permissions."
      : `Update details for ${props.initialData.email ?? props.initialData.name ?? "this user"}.`;

  const handleSubmit = form.handleSubmit(values => {
    setFormError(null);
    form.clearErrors();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", values.email);
      formData.set("role", values.role ?? "user");
      if (values.name !== undefined) {
        formData.set("name", values.name ?? "");
      }
      if (values.image !== undefined) {
        formData.set("image", values.image ?? "");
      }

      const result =
        mode === "create"
          ? await createUserAction(formData)
          : await updateUserAction(props.initialData.id, formData);

      if (!result.ok) {
        const fieldErrors = result.errors?.fieldErrors ?? {};
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = messages?.[0];
          if (!message) continue;
          form.setError(field as keyof UserFormValues, {
            type: "server",
            message,
          });
        }
        const rootMessage = result.errors?.formErrors?.[0];
        if (rootMessage) {
          setFormError(rootMessage);
        }
        return;
      }

      toast.success(mode === "create" ? "User created" : "User updated");
      handleOpenChange(false);
      onSuccess?.({ reset: mode === "create" });
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jane Rider"
                        value={field.value ?? ""}
                        onChange={event => {
                          const value = event.target.value;
                          field.onChange(value === "" ? null : value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Optional. Used in greetings and receipts.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://cdn.example.com/avatar.jpg"
                        value={field.value ?? ""}
                        onChange={event => {
                          const value = event.target.value;
                          field.onChange(value === "" ? null : value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Optional. Provide a direct link to the user image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? "user"}
                        onValueChange={value => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
