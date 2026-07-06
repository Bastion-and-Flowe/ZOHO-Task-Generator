"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissToast, useToasts } from "./use-toast";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-soft animate-in slide-in-from-bottom-2",
            t.variant === "destructive" && "border-destructive/40 bg-destructive/10",
            t.variant === "success" && "border-primary/40 bg-primary/10"
          )}
        >
          <div>
            <p className="text-sm font-medium text-foreground">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
