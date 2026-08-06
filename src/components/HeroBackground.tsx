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
        className="h-full w-full object-cover"
        style={{ objectPosition: position }}
      />
      <div
        className={
          tone === "dark"
            ? "absolute inset-0 bg-laurel/80 mix-blend-multiply"
            : "absolute inset-0 bg-ivory-wash/88"
        }
      />
      <div
        className={
          tone === "dark"
            ? "absolute inset-0 bg-gradient-to-r from-laurel/70 via-laurel/40 to-transparent"
            : "absolute inset-0 bg-gradient-to-b from-ivory-wash/70 via-ivory-wash/60 to-background"
        }
      />
    </div>
  );
}
