import { useRef, useState } from "react";

interface Props {
  before: string;
  after: string;
  alt?: string;
  className?: string;
}

export function BeforeAfter({ before, after, alt = "Before and after cleaning", className = "" }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-[2rem] ring-1 ring-border shadow-bloom select-none touch-none ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <img src={after} alt={alt} className="block w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt=""
          aria-hidden
          className="block h-full object-cover"
          style={{ width: ref.current ? `${ref.current.getBoundingClientRect().width}px` : "100%", maxWidth: "none" }}
          draggable={false}
        />
      </div>
      <div className="absolute top-4 left-4 rounded-full bg-black/60 text-white text-xs font-bold px-3 py-1 backdrop-blur">Before</div>
      <div className="absolute top-4 right-4 rounded-full bg-white/90 text-primary text-xs font-bold px-3 py-1 shadow">After ✨</div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.35)] cursor-ew-resize"
        style={{ left: `calc(${pos}% - 2px)` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white ring-2 ring-primary grid place-items-center text-primary font-bold">
          <span className="text-lg leading-none">⇋</span>
        </div>
      </div>
    </div>
  );
}