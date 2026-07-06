import Papa from "papaparse";
import { formatCsvDate } from "./utils";

// Exact column names required by Zoho Projects import.
export const ZOHO_COLUMNS = [
  "Task Name",
  "Owner",
  "Department",
  "Sub-Department",
  "Project Type",
  "Start Date",
  "Due Date",
  "Description",
  "Priority",
  "Status",
  "Estimated Hours",
] as const;

export interface TaskRowInput {
  taskName: string;
  dueDate: string | Date;
}

export interface UserDefaults {
  name: string;
  department: string;
  subDepartment: string;
}

/**
 * Merges each lightweight task row (Task Name + Due Date only) with the
 * user's stored profile defaults to produce a full Zoho Projects import row.
 */
export function buildZohoRows(tasks: TaskRowInput[], user: UserDefaults) {
  const startDate = formatCsvDate(new Date());
  return tasks.map((t) => ({
    "Task Name": t.taskName,
    Owner: user.name,
    Department: user.department,
    "Sub-Department": user.subDepartment,
    "Project Type": "Internal",
    "Start Date": startDate,
    "Due Date": formatCsvDate(t.dueDate),
    Description: "",
    Priority: "Medium",
    Status: "Open",
    "Estimated Hours": "",
  }));
}

/** Serializes rows into a CSV string with the exact Zoho column order. */
export function generateCsv(tasks: TaskRowInput[], user: UserDefaults) {
  const rows = buildZohoRows(tasks, user);
  return Papa.unparse({ fields: [...ZOHO_COLUMNS], data: rows });
}
