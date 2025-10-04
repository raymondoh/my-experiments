// utils/formatDate.ts

// --- LONG FORM HELPERS (For prose and descriptive text) ---

/**
 * Formats a date to a long-form British English string (e.g., "28 August 2025").
 * @param dateInput The date to format.
 * @returns The formatted date string, or null if the input is invalid.
 */
export const formatDateGB = (dateInput: Date | string | number | null | undefined): string | null => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric"
  };
  return date.toLocaleDateString("en-GB", options);
};

/**
 * Formats a date and time to a long-form British English string
 * (e.g., "28 August 2025 at 12:57").
 * @param dateInput The date to format.
 * @returns The formatted string, or null if the input is invalid.
 */
export const formatDateTimeGB = (dateInput: Date | string | number | null | undefined): string | null => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };
  const formattedString = date.toLocaleString("en-GB", options);
  return formattedString.replace(",", " at");
};

// --- SHORT FORM HELPERS (For tables and compact UI) ---

/**
 * Formats a date to a short, numeric British English string (e.g., "28/08/2025").
 * @param dateInput The date to format.
 * @returns The formatted date string, or null if the input is invalid.
 */
export const formatDateShortGB = (dateInput: Date | string | number | null | undefined): string | null => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  };
  return date.toLocaleDateString("en-GB", options);
};

/**
 * Formats a date and time to a short, numeric British English string
 * (e.g., "28/08/2025, 12:57").
 * @param dateInput The date to format.
 * @returns The formatted string, or null if the input is invalid.
 */
export const formatDateTimeShortGB = (dateInput: Date | string | number | null | undefined): string | null => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };
  return date.toLocaleString("en-GB", options);
};
