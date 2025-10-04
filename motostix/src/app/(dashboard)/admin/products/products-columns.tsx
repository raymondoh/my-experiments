import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { Eye, MoreHorizontal, Pencil, Star, Tag, Trash2 } from "lucide-react";

import type { Product } from "@/lib/services/products";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductDialog } from "./ProductDialog";

export interface ProductColumnHandlers {
  onView?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onMutate?: (options?: { reset?: boolean }) => void;
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

export const createProductColumns = (
  handlers: ProductColumnHandlers = {},
): ColumnDef<Product>[] => [
  {
    accessorKey: "image",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const product = row.original;
      const src = product.image ?? product.images?.[0];
      return (
        <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
          {src ? (
            <Image src={src} alt={product.name} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{product.name}</span>
          <span className="text-xs text-muted-foreground">SKU: {product.sku ?? "—"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return (
        <Badge variant="outline" className="capitalize">
          {category || "Uncategorised"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const product = row.original;
      const price = formatPrice(product.price);
      if (product.onSale && product.salePrice != null) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-primary">{formatPrice(product.salePrice)}</span>
            <span className="text-xs text-muted-foreground line-through">{price}</span>
          </div>
        );
      }
      return <span className="font-medium">{price}</span>;
    },
  },
  {
    accessorKey: "onSale",
    header: "On Sale",
    cell: ({ row }) => {
      const product = row.original;
      if (!product.onSale) {
        return <span className="text-sm text-muted-foreground">No</span>;
      }
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Sale
        </Badge>
      );
    },
  },
  {
    accessorKey: "ratingAvg",
    header: "Rating",
    cell: ({ row }) => {
      const { ratingAvg, ratingCount } = row.original;
      if (!ratingAvg) {
        return <span className="text-sm text-muted-foreground">No reviews</span>;
      }
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span>{ratingAvg.toFixed(1)}</span>
          {ratingCount ? <span className="text-xs">({ratingCount})</span> : null}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAtISO",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAtISO ?? row.original.createdAt ?? null;
      if (!createdAt) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <span className="text-sm text-muted-foreground" title={dayjs(createdAt).format("MMM D, YYYY HH:mm")}>
          {formatRelative(createdAt)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
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
            <DropdownMenuItem onSelect={() => handlers.onView?.(product)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <ProductDialog
              mode="edit"
              initialData={product}
              onSuccess={handlers.onMutate}
              trigger={
                <DropdownMenuItem onSelect={event => event.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem
              onSelect={() => handlers.onDelete?.(product)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
