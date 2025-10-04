import { requireSession } from "@/lib/auth/require-session";
import { inventoryService } from "@/lib/services/inventory-service";
import { InventoryManagementPanel } from "../_components/inventory-management-panel";
import {
  createInventoryItemAction,
  updateInventoryItemAction,
  adjustInventoryQuantityAction,
  deleteInventoryItemAction
} from "../actions";

export default async function BusinessOwnerInventoryPage() {
  const session = await requireSession();
  const items = await inventoryService.listItems(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">
          Keep your vans stocked and know when it’s time to reorder essential parts.
        </p>
      </div>

      <InventoryManagementPanel
        items={items}
        onCreateItem={createInventoryItemAction}
        onUpdateItem={updateInventoryItemAction}
        onAdjustQuantity={adjustInventoryQuantityAction}
        onDeleteItem={deleteInventoryItemAction}
      />
    </div>
  );
}
