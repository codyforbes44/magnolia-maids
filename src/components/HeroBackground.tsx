type Props = {
  src: string;
  /** "light" tints toward ivory for dark text; "dark" tints toward laurel for white text. */
  tone?: "light" | "dark";
  position?: string;
  className?: string;
};

/**
 * Decorative hero background photo with a tint overlay so foreground copy
 * keeps AA contrast. Place as the first child of a `relative` hero section.
 */
export function HeroBackground({ src, tone = "light", position = "center", className = "" }: Props) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover scale-105 blur-[1px]"
        style={{ objectPosition: position }}
      />
      <div
        className="absolute inset-0"
        style={
          tone === "dark"
            ? { backgroundColor: "color-mix(in oklab, var(--forest) 58%, transparent)" }
            : { backgroundColor: "color-mix(in oklab, var(--background) 48%, transparent)" }
        }
      />
      <div
        className="absolute inset-0"
        style={
          tone === "dark"
            ? {
                backgroundImage:
                  "linear-gradient(100deg, color-mix(in oklab, var(--forest) 80%, transparent) 0%, color-mix(in oklab, var(--forest) 45%, transparent) 55%, transparent 100%)",
              }
            : {
                backgroundImage:
                  "linear-gradient(180deg, color-mix(in oklab, var(--background) 42%, transparent) 0%, color-mix(in oklab, var(--background) 58%, transparent) 55%, var(--background) 100%)",
              }
        }
      />
    </div>
  );
}
