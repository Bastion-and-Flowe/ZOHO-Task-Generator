import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a Date as "17 Jul 2026" for display in the task table. */
export function formatDisplayDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats a Date as "2026-07-03" for CSV export / Start Date / Due Date fields. */
export function formatCsvDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayIsoDate() {
  return formatCsvDate(new Date());
}

/** Builds the export filename: Zoho_Tasks_YYYY-MM-DD_HHMM.csv */
export function buildExportFilename(date: Date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `Zoho_Tasks_${yyyy}-${mm}-${dd}_${hh}${min}.csv`;
}
