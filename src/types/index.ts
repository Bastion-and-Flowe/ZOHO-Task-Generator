export interface TaskRow {
  id: string;
  taskName: string;
  dueDate: string; // ISO string, empty until chosen
}

export interface DraftSummary {
  id: string;
  title: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportSummary {
  id: string;
  filename: string;
  taskCount: number;
  createdAt: string;
}

export interface SessionUserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  subDepartment: string;
}
