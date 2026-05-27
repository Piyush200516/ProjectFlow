import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
