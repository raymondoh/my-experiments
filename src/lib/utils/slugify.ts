import { getFirebaseAdminDb } from "@/lib/firebase/admin";

/**
 * Converts a string into a URL-friendly slug.
 *
 * - Converts to lowercase
 * - Replaces '&' with 'and' for readability
 * - Removes accents and diacritics (e.g., 'é' -> 'e')
 * - Replaces non-alphanumeric characters with a hyphen
 * - Collapses consecutive hyphens into one
 * - Trims hyphens from the start and end
 * - Truncates the result to a maximum length
 *
 * @param input The string to convert.
 * @param maxLength The maximum allowed length for the slug.
 * @returns The generated URL-friendly slug.
 */
export function toSlug(input: string, maxLength = 64): string {
  if (!input) return "";

  return input
    .normalize("NFKD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/&/g, " and ") // Replace ampersand with ' and '
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/-{2,}/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .slice(0, maxLength); // Enforce max length
}

/**
 * Generates a unique slug for a document within a Firestore collection.
 *
 * If the initial slug exists, it appends a numeric suffix (e.g., 'my-slug-2')
 * until a unique slug is found. It intelligently truncates the base slug
 * to ensure the final slug (including the suffix) does not exceed the max length.
 *
 * @param collectionPath The path to the Firestore collection.
 * @param base The string to use as the basis for the slug.
 * @param excludeDocId (Optional) A document ID to ignore during the uniqueness check,
 * typically used when updating an existing document.
 * @returns A promise that resolves to a unique slug string.
 */
export async function toUniqueSlug(
  collectionPath: string,
  base: string,
  excludeDocId?: string
): Promise<string> {
  const db = getFirebaseAdminDb();
  const baseSlug = toSlug(base);
  let candidate = baseSlug;
  let counter = 1;
  const maxLength = 64; // Define max length for consistency

  while (true) {
    const snapshot = await db
      .collection(collectionPath)
      .where("slug", "==", candidate)
      .limit(1)
      .get();

    // If slug is not found, it's unique
    if (snapshot.empty) {
      return candidate;
    }

    // If found, check if it's the document we're allowed to ignore
    const conflictingDoc = snapshot.docs[0];
    if (excludeDocId && conflictingDoc.id === excludeDocId) {
      return candidate;
    }

    // If it's a true conflict, generate a new candidate and loop again
    counter += 1;
    const suffix = `-${counter}`;
    const truncatedBase = baseSlug.slice(0, maxLength - suffix.length);
    candidate = `${truncatedBase}${suffix}`;
  }
}