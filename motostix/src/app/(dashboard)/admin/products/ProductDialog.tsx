"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Product } from "@/lib/services/products";
import { cn } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  createProductAction,
  updateProductAction,
} from "./actions";
import {
  createProductSchema,
  type CreateProductInput,
} from "./product-schemas";

type ProductDialogBaseProps = {
  trigger?: React.ReactNode;
  className?: string;
  onSuccess?: (options?: { reset?: boolean }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type CreateDialogProps = ProductDialogBaseProps & {
  mode: "create";
  initialData?: Partial<Product>;
};

type EditDialogProps = ProductDialogBaseProps & {
  mode: "edit";
  initialData: Product;
};

type ProductDialogProps = CreateDialogProps | EditDialogProps;

type ProductFormValues = CreateProductInput;

const createEmptyValues = (): ProductFormValues => ({
  name: "",
  slug: "",
  price: 0,
  category: "",
  images: [],
  onSale: false,
  salePrice: null,
});

const toArrayFromInput = (value: string): string[] =>
  value
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);

export function ProductDialog(props: ProductDialogProps) {
  const { mode, trigger, className, onSuccess, onOpenChange } = props;
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;

  const defaultValues = React.useMemo<ProductFormValues>(() => {
    if (mode === "edit") {
      const product = props.initialData;
      return {
        name: product.name ?? "",
        slug: product.slug ?? "",
        price: product.price ?? 0,
        category: product.category ?? "",
        images: Array.isArray(product.images)
          ? product.images
          : product.image
            ? [product.image]
            : [],
        onSale: Boolean(product.onSale),
        salePrice:
          product.salePrice != null ? Number(product.salePrice) : null,
      };
    }

    if (props.initialData) {
      return {
        name: props.initialData.name ?? "",
        slug: props.initialData.slug ?? "",
        price: props.initialData.price ?? 0,
        category: props.initialData.category ?? "",
        images: Array.isArray(props.initialData.images)
          ? props.initialData.images
          : props.initialData.image
            ? [props.initialData.image]
            : [],
        onSale: Boolean(props.initialData.onSale),
        salePrice:
          props.initialData.salePrice != null
            ? Number(props.initialData.salePrice)
            : null,
      };
    }

    return createEmptyValues();
  }, [mode, props.initialData]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  });

  const onSale = form.watch("onSale");

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

  const submitLabel = mode === "create" ? "Create product" : "Save changes";
  const dialogTitle = mode === "create" ? "Add product" : "Edit product";
  const dialogDescription =
    mode === "create"
      ? "Add a new product to your catalogue."
      : `Update details for ${props.initialData.name ?? "this product"}.`;

  const handleSubmit = form.handleSubmit(values => {
    setFormError(null);
    form.clearErrors();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("slug", values.slug);
      formData.set("price", values.price.toString());
      formData.set("category", values.category);
      formData.set("images", values.images.join(","));
      formData.set("onSale", values.onSale ? "true" : "false");
      if (values.onSale && values.salePrice != null && values.salePrice !== undefined) {
        formData.set("salePrice", values.salePrice.toString());
      } else {
        formData.delete("salePrice");
      }

      const result =
        mode === "create"
          ? await createProductAction(formData)
          : await updateProductAction(props.initialData.id, formData);

      if (!result.ok) {
        const fieldErrors = result.errors?.fieldErrors ?? {};
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = messages?.[0];
          if (!message) continue;
          form.setError(field as keyof ProductFormValues, {
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

      toast.success(
        mode === "create" ? "Product created" : "Product updated",
      );
      handleOpenChange(false);
      onSuccess?.({ reset: mode === "create" });
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn("sm:max-w-xl", className)}>
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
                    <FormLabel>Product name</FormLabel>
                    <FormControl>
                      <Input placeholder="Moto X Bars" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="moto-x-bars" {...field} />
                    </FormControl>
                    <FormDescription>Used in URLs and SEO.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={event => {
                            const value = event.target.value;
                            field.onChange(value === "" ? undefined : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Handlebars" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={field.value?.join(", ") ?? ""}
                        onChange={event => field.onChange(toArrayFromInput(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of image URLs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="onSale"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>On sale</FormLabel>
                      <FormDescription>Show a sale badge and price.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {onSale ? (
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={event => {
                            const value = event.target.value;
                            if (value === "") {
                              field.onChange(null);
                              return;
                            }
                            field.onChange(Number(value));
                          }}
                          disabled={!onSale}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
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
