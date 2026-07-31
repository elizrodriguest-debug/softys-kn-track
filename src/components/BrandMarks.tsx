import { cn } from "@/lib/utils";

export function BrandMarks({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "font-display text-sm font-bold tracking-[0.18em]",
          dark ? "text-brand" : "text-brand-foreground",
        )}
      >
        SOFTYS
      </span>
      <span className={cn("text-xs", dark ? "text-muted-foreground" : "text-brand-foreground/50")}>
        ×
      </span>
      <span
        className={cn(
          "font-display text-sm font-bold tracking-tight",
          dark ? "text-brand" : "text-brand-foreground",
        )}
      >
        KUEHNE<span className="text-success">+</span>NAGEL
      </span>
    </div>
  );
}
