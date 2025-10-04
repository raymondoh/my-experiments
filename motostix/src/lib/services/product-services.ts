"use server";

import { getAdminFirestore } from "@/lib/firebase/admin/initialize";
import { isFirebaseError, firebaseError } from "@/utils/firebase-error";
import { createLogger } from "@/lib/logger";

const log = createLogger("services.product-maintenance");

// Get product sample for debugging
export async function getProductSample(limit = 5): Promise<any[]> {
  try {
    const db = getAdminFirestore();
    const productsRef = db.collection("products");
    const querySnapshot = await productsRef.limit(limit).get();

    const products: any[] = [];
    querySnapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return products;
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error occurred while fetching product sample";

    log.error("fetch sample failed", message);
    return [];
  }
}
// Fix missing onSale field for all products
export async function fixMissingOnSaleField() {
  try {
    const db = getAdminFirestore();
    // Get all products
    const snapshot = await db.collection("products").get();

    const updates: Promise<any>[] = [];
    let fixedCount = 0;
    let alreadyHadField = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // Check if onSale field exists
      if (data.onSale === undefined || data.onSale === null) {
        log.debug("adding onSale flag", { productId: doc.id });

        updates.push(
          doc.ref.update({
            onSale: false
          })
        );
        fixedCount++;
      } else {
        alreadyHadField++;
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      log.info("onSale field updated", { fixedCount, total: snapshot.docs.length });
    } else {
      log.info("onSale already present", { total: snapshot.docs.length });
    }

    return {
      success: true,
      fixed: fixedCount,
      alreadyHadField: alreadyHadField,
      total: snapshot.docs.length,
      message: `Fixed ${fixedCount} products, ${alreadyHadField} already had the field`
    };
  } catch (error) {
    const message = isFirebaseError(error)
      ? firebaseError(error)
      : error instanceof Error
      ? error.message
      : "Unknown error occurred while fixing onSale field";

    log.error("fix onSale failed", message);
    return {
      success: false,
      error: message
    };
  }
}
