// src/lib/config/locations.ts

/**
 * A centralized list of cities and services to generate dynamic pages for.
 * This makes it easy to add or remove pages just by updating these arrays.
 */

export const CITIES = [
  "London"
  //"Manchester"
  // "Birmingham",
  // "Glasgow",
  // "Bristol"
];

/**
 * The complete list of all services a tradesperson can select.
 * This is the SINGLE SOURCE OF TRUTH for specialties.
 */
export const ALL_SERVICES = [
  "Boiler Repair & Installation",
  "Leak Detection & Repair",
  "Drain Cleaning & Unblocking",
  "Bathroom Plumbing",
  "Kitchen Plumbing",
  "Gas Services (Gas Safe Registered)",
  "Central Heating Systems",
  "Water Heater Installation",
  "Emergency Plumber",
  "Tiling"
];

/**
 * A curated list of the most popular services.
 * Used for generating footer links and dynamic pages to keep the build focused.
 */
export const POPULAR_SERVICES = [
  "Boiler Repair",
  "Leak Detection",
  "Drain Cleaning",
  "Bathroom Plumbing",
  "Emergency Plumber"
];
