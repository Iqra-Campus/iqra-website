"use client";
import { Children, useCallback, useEffect, useRef, useState } from "react";

export default function Carousel({ children, dark = false, label }: { children: React.ReactNode; dark?: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const count = Children.count(children);

  const onScroll = useCallback(() => {
    const el = ref.current; if (!el || !el.children.length) return;
    const first = el.children[0] as HTMLElement;
    const step = first.offsetWidth + 16;
    setIdx(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / step))));
  }, [count]);
  useEffect(() => { onScroll(); }, [onScroll]);

  const go = (i: number) => {
    const el = ref.current; if (!el) return;
    const t = el.children[i] as HTMLElement | undefined;
    t?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };
  return (
    <div role="region" aria-label={label}>
      <div ref={ref} onScroll={onScroll} className="snap-row" tabIndex={0}>{children}</div>
      {count > 1 && (
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label={label}>
          {Array.from({ length: count }, (_, i) => (
            <button key={i} role="tab" aria-selected={i === idx} aria-label={`${i + 1} / ${count}`} onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-10 bg-gold-400" : dark ? "w-2 bg-white/30" : "w-2 bg-navy-300/60"}`} />
          ))}
        </div>)}
    </div>
  );
}
