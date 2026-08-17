import { type ReactNode } from "react";
import { ChevronLeft, Signal, Wifi, BatteryFull } from "lucide-react";

/**
 * A realistic, welcoming phone shell for the Magnolia Maids communications
 * hub — rounded hardware frame, status bar, title bar, and a home dock.
 */
export function PhoneFrame({
  title,
  subtitle,
  onBack,
  dock,
  children,
  accessory,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  dock?: ReactNode;
  children: ReactNode;
  accessory?: ReactNode;
}) {
  const clock = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="rounded-[2.75rem] border border-border bg-foreground/90 p-2.5 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-primary px-6 pb-2 pt-3 text-[11px] font-semibold text-primary-foreground">
            <span>{clock}</span>
            <span className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground/90" />
            <span className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-border bg-primary px-4 pb-3 text-primary-foreground">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back"
                className="-ml-1 rounded-full p-1 hover:bg-primary-foreground/15"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold leading-tight">{title}</p>
              {subtitle && (
                <p className="truncate text-xs text-primary-foreground/80">{subtitle}</p>
              )}
            </div>
            {accessory}
          </div>

          {/* Screen */}
          <div className="h-[620px] overflow-y-auto bg-secondary/40">{children}</div>

          {/* Dock */}
          {dock && (
            <div className="border-t border-border bg-background/95 px-3 pb-4 pt-2 backdrop-blur">
              {dock}
              <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-muted-foreground/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
