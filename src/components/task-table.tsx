"use client";

import { useCallback, useRef } from "react";
import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, todayIsoDate } from "@/lib/utils";
import type { TaskRow } from "@/types";

interface TaskTableProps {
  rows: TaskRow[];
  onChange: (rows: TaskRow[]) => void;
  errors?: Record<string, { taskName?: string; dueDate?: string }>;
}

function newRow(): TaskRow {
  return { id: crypto.randomUUID(), taskName: "", dueDate: "" };
}

export function TaskTable({ rows, onChange, errors = {} }: TaskTableProps) {
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const dateRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const minDate = todayIsoDate();

  const focusName = useCallback((id: string) => {
    requestAnimationFrame(() => nameRefs.current[id]?.focus());
  }, []);

  const focusDate = useCallback((id: string) => {
    requestAnimationFrame(() => dateRefs.current[id]?.focus());
  }, []);

  const updateRow = (id: string, patch: Partial<TaskRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = (afterId?: string) => {
    const row = newRow();
    if (!afterId) {
      onChange([...rows, row]);
    } else {
      const idx = rows.findIndex((r) => r.id === afterId);
      const next = [...rows];
      next.splice(idx + 1, 0, row);
      onChange(next);
    }
    focusName(row.id);
  };

  const duplicateRow = (id: string) => {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const copy = { ...rows[idx], id: crypto.randomUUID() };
    const next = [...rows];
    next.splice(idx + 1, 0, copy);
    onChange(next);
    focusName(copy.id);
  };

  const deleteRow = (id: string) => {
    if (rows.length === 1) {
      onChange([newRow()]);
      return;
    }
    const idx = rows.findIndex((r) => r.id === id);
    const remaining = rows.filter((r) => r.id !== id);
    onChange(remaining);

    const fallback = remaining[Math.max(0, idx - 1)] ?? remaining[0];
    if (fallback) {
      focusName(fallback.id);
    }
  };

  const moveFocus = (rowIndex: number, column: "name" | "date", direction: "up" | "down" | "left" | "right") => {
    if (direction === "left" && column === "date") {
      focusName(rows[rowIndex]?.id);
      return;
    }
    if (direction === "right" && column === "name") {
      focusDate(rows[rowIndex]?.id);
      return;
    }

    const nextRowIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
    const nextRow = rows[nextRowIndex];
    if (!nextRow) return;
    if (column === "name") focusName(nextRow.id);
    if (column === "date") focusDate(nextRow.id);
  };

  // Enter in Task Name -> move to that row's Due Date field.
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, rowIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dateRefs.current[id]?.focus();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(rowIndex, "name", e.key === "ArrowRight" ? "right" : e.key === "ArrowDown" ? "down" : "up");
    }
  };

  // Enter in Due Date -> go to the next row's Task Name, creating one if needed.
  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, rowIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = rows[rowIndex + 1];
      if (next) {
        focusName(next.id);
      } else {
        addRow(id);
      }
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(rowIndex, "date", e.key === "ArrowLeft" ? "left" : e.key === "ArrowDown" ? "down" : "up");
    }
  };

  // Supports pasting multiple lines (e.g. copied from Excel) into the Task Name column.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, id: string) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n") && !text.includes("\t")) return; // let default paste happen
    e.preventDefault();

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const idx = rows.findIndex((r) => r.id === id);
    const parsedRows = lines.map((line) => {
      const [taskName, dueDate] = line.split("\t");
      return { id: crypto.randomUUID(), taskName: taskName ?? "", dueDate: dueDate ?? "" };
    });

    const next = [...rows];
    next.splice(idx, 1, ...parsedRows);
    onChange(next);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border shadow-soft">
      <table className="min-w-[640px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="w-8 px-3 py-2.5"></th>
            <th className="px-3 py-2.5">Task Name</th>
            <th className="w-48 px-3 py-2.5">Due Date</th>
            <th className="w-28 px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowErrors = errors[row.id];
            return (
              <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4 opacity-40" />
                </td>
                <td className="px-3 py-2">
                  <Input
                    ref={(el) => {
                      nameRefs.current[row.id] = el;
                    }}
                    value={row.taskName}
                    maxLength={250}
                    aria-label={`Task name for row ${i + 1}`}
                    placeholder={`Task ${i + 1}, e.g. "Investigate Lewis pipeline"`}
                    onChange={(e) => updateRow(row.id, { taskName: e.target.value })}
                    onKeyDown={(e) => handleNameKeyDown(e, row.id, i)}
                    onPaste={(e) => handlePaste(e, row.id)}
                    className={cn("border-transparent bg-transparent shadow-none focus-visible:border-input", rowErrors?.taskName && "border-destructive")}
                  />
                  {rowErrors?.taskName && <p className="mt-1 text-xs text-destructive">{rowErrors.taskName}</p>}
                </td>
                <td className="px-3 py-2">
                  <Input
                    ref={(el) => {
                      dateRefs.current[row.id] = el;
                    }}
                    type="date"
                    aria-label={`Due date for row ${i + 1}`}
                    min={minDate}
                    value={row.dueDate}
                    onChange={(e) => updateRow(row.id, { dueDate: e.target.value })}
                    onKeyDown={(e) => handleDateKeyDown(e, row.id, i)}
                    className={cn("border-transparent bg-transparent shadow-none focus-visible:border-input", rowErrors?.dueDate && "border-destructive")}
                  />
                  {rowErrors?.dueDate && <p className="mt-1 text-xs text-destructive">{rowErrors.dueDate}</p>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Duplicate row" aria-label={`Duplicate row ${i + 1}`} onClick={() => duplicateRow(row.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete row" aria-label={`Delete row ${i + 1}`} onClick={() => deleteRow(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-border bg-muted/20 p-2">
        <Button variant="ghost" size="sm" onClick={() => addRow()}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Row
        </Button>
      </div>
    </div>
  );
}

export { newRow };
