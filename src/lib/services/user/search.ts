// src/lib/services/user/search.ts
import { Filter } from "firebase-admin/firestore";
import { UsersCollection } from "@/lib/firebase/admin";
import type { User } from "@/lib/types/user";
import { toSlug } from "@/lib/utils";
import { mapToUser } from "./utils";

export async function getActiveTradespeople(): Promise<User[]> {
  try {
    const snapshot = await UsersCollection().where("role", "==", "tradesperson").where("status", "==", "active").get();

    return snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
  } catch (err) {
    console.error("UserService: getActiveTradespeople error:", err);
    return [];
  }
}

export async function getFeaturedTradespeople(limit = 6): Promise<User[]> {
  try {
    const snapshot = await UsersCollection()
      .where("role", "==", "tradesperson")
      .where("status", "==", "active")
      .where("isFeatured", "==", true)
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
  } catch (err) {
    console.error("UserService: getFeaturedTradespeople error:", err);
    return [];
  }
}

export async function findTradespeopleByCityAndService(citySlug: string, serviceSlug: string): Promise<User[]> {
  // This function will now leverage the robust `searchTradespeople` function
  const combinedQuery = `${serviceSlug.replace(/-/g, " ")} in ${citySlug.replace(/-/g, " ")}`;
  return searchTradespeople(combinedQuery);
}

export async function findTradespeopleByCity(citySlug: string): Promise<User[]> {
  try {
    const locationFilter = Filter.or(
      Filter.where("citySlug", "==", citySlug),
      Filter.where("serviceAreaSlugs", "array-contains", citySlug)
    );

    const snapshot = await UsersCollection()
      .where("role", "==", "tradesperson")
      .where("status", "==", "active")
      .where(locationFilter)
      .get();

    return snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));
  } catch (err) {
    console.error("UserService: findTradespeopleByCity error:", err);
    return [];
  }
}

export async function searchTradespeople(query: string): Promise<User[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return getActiveTradespeople();
  }

  // --- REVISED AND SIMPLIFIED SEARCH LOGIC ---
  try {
    // Normalize query into individual keywords
    const keywords = trimmedQuery
      .toLowerCase()
      .replace(/ in | near | for /g, " ") // Replace "in", "near", "for" with a space
      .replace(/[()&,]/g, "") // Remove special characters
      .split(/\s+/)
      .filter(Boolean);

    if (keywords.length === 0) {
      return getActiveTradespeople();
    }

    // Use a single, powerful query against the `searchKeywords` array
    const snapshot = await UsersCollection()
      .where("role", "==", "tradesperson")
      .where("status", "==", "active")
      .where("searchKeywords", "array-contains-any", keywords)
      .get();

    const users = snapshot.docs.map(doc => mapToUser(doc.id, doc.data() as Record<string, unknown>));

    // For multi-word queries, we do a final filter in memory to ensure ALL keywords are present
    // This gives us "AND" behavior on top of the initial "OR" query from the database
    return keywords.length > 1
      ? users.filter(user => {
          const userKeywords = new Set(user.searchKeywords?.map(k => k.toLowerCase()));
          return keywords.every(k => userKeywords.has(k));
        })
      : users;
  } catch (err) {
    console.error("UserService: searchTradespeople error:", err);
    return [];
  }
  // --- END OF REVISED LOGIC ---
}
