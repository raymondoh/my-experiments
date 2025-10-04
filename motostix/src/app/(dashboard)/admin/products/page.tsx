import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardHeader, DashboardShell } from "@/components";
import { Separator } from "@/components/ui/separator";
import { createLogger } from "@/lib/logger";
import { listProducts } from "@/lib/services/products";
import { UserService } from "@/lib/services/user-service";

import { ProductsClient } from "./ProductsClient";

const log = createLogger("dashboard.admin.products");

export const metadata: Metadata = {
  title: "Product Management",
  description: "Manage products in your catalog",
};

export default async function AdminProductsPage() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    const role = await UserService.getUserRole(session.user.id);
    if (role !== "admin") {
      redirect("/not-authorized");
    }

    const initial = await listProducts({ limit: 24 });
    log.debug("loaded initial products", {
      count: initial.items.length,
      hasNext: Boolean(initial.nextCursor),
    });

    return (
      <DashboardShell>
        <DashboardHeader
          title="Product Management"
          description="View and manage products in your catalog."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Products" }]}
        />
        <Separator className="mb-8" />
        <ProductsClient initial={initial} />
      </DashboardShell>
    );
  } catch (error) {
    log.error("failed to render products page", error);
    redirect("/login");
  }
}
