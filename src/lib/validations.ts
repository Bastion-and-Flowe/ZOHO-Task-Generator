import { z } from "zod";

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isPastDate(dateString: string) {
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < startOfToday();
}

export const registerSchema = z.object({
  name: z.string().min(2, "Full name is required").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.string().min(1, "Department is required"),
  subDepartment: z.string().min(1, "Sub-Department is required"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: z.string().min(2).max(120),
  department: z.string().min(1),
  subDepartment: z.string().min(1),
  password: z.string().min(8).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// A single row in the fast-entry task table.
const rowIdSchema = z.string().min(1);
const taskNameSchema = z.string().max(250, "Maximum 250 characters");
const dueDateSchema = z.string();

export const draftTaskRowSchema = z.object({
  id: rowIdSchema,
  taskName: taskNameSchema,
  dueDate: dueDateSchema,
});

export const taskRowSchema = draftTaskRowSchema
  .refine((row) => row.taskName.trim().length > 0, {
    message: "Task name is required",
    path: ["taskName"],
  })
  .refine((row) => row.dueDate.trim().length > 0, {
    message: "Due date is required",
    path: ["dueDate"],
  })
  .refine((row) => (row.dueDate.trim() ? !isPastDate(row.dueDate) : true), {
    message: "Due date cannot be before today",
    path: ["dueDate"],
  });

export const draftTaskListSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  rows: z.array(draftTaskRowSchema),
});

export const taskListSchema = z.object({
  rows: z.array(taskRowSchema).min(1, "At least one task is required"),
});
