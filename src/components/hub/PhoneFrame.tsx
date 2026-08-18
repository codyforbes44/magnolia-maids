import { type ReactNode } from "react";
import { ChevronLeft, Signal, Wifi, BatteryFull } from "lucide-react";

export type HubLayout = "phone" | "desktop" | "fullscreen" | "phone-fullscreen";

/**
 * A realistic, welcoming phone shell for the Magnolia Maids communications
 * hub — rounded hardware frame, status bar, title bar, and a home dock.
 * In `desktop` / `fullscreen` layouts the same content opens into a wide
 * two-pane workspace with a left app rail.
 */
export function PhoneFrame({
  title,
  subtitle,
  onBack,
  dock,
  children,
  accessory,
  toolbar,
  layout = "phone",
  sidebar,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  dock?: ReactNode;
  children: ReactNode;
  accessory?: ReactNode;
  toolbar?: ReactNode;
  layout?: HubLayout;
  sidebar?: ReactNode;
}) {
  const clock = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const phoneFull = layout === "phone-fullscreen";

  if (layout === "desktop" || layout === "fullscreen") {
    const full = layout === "fullscreen";
    return (
      <div
        className={
          full
            ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
            : "mx-auto flex w-full max-w-[1400px] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
        }
      >
        <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="-ml-1 shrink-0 rounded-full p-1 hover:bg-primary-foreground/15"
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
          {toolbar && <div className="hidden w-[26rem] max-w-[45%] md:block">{toolbar}</div>}
          {accessory}
        </div>

        {toolbar && <div className="border-b border-border px-3 py-2 md:hidden">{toolbar}</div>}

        <div
          className={`grid min-h-0 flex-1 grid-cols-[13rem_minmax(0,1fr)] ${
            full ? "" : "h-[calc(100vh-16rem)] min-h-[32rem]"
          }`}
        >
          <nav className="min-h-0 overflow-y-auto border-r border-border bg-background p-2">
            {sidebar ?? dock}
          </nav>
          <div className="min-h-0 overflow-y-auto bg-secondary/40">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        phoneFull ? "flex h-full min-h-0 w-full flex-col" : "mx-auto w-full max-w-[420px]"
      }
    >
      <div
        className={
          phoneFull
            ? "flex min-h-0 flex-1 flex-col"
            : "rounded-[2.75rem] border border-border bg-foreground/90 p-2.5 shadow-2xl"
        }
      >
        <div
          className={
            phoneFull
              ? "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
              : "relative overflow-hidden rounded-[2.25rem] bg-background"
          }
        >
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

          {toolbar && (
            <div className="border-b border-border bg-background px-3 py-2">{toolbar}</div>
          )}

          {/* Screen */}
          <div
            className={`overflow-y-auto bg-secondary/40 ${
              phoneFull ? "min-h-0 flex-1" : "h-[600px]"
            }`}
          >
            {children}
          </div>

          {/* Dock */}
          {dock && (
            <div className="shrink-0 border-t border-border bg-background/95 px-3 pb-4 pt-2 backdrop-blur">
              {dock}
              <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-muted-foreground/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
