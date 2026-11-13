"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const bannerLink = "inline-flex min-h-11 items-center underline-offset-4 hover:underline";

/** The demo banner (DEMO-STANDARD.md). `data-demo-banner` lets tools/capture hide it. */
export function DemoBanner({ onReset }: { onReset: () => void }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function reset() {
    onReset();
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 3000);
  }

  return (
    <aside aria-label="Demo" data-demo-banner className="bg-ink text-paper-dim">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-x-6 px-4 text-label sm:px-6">
        <p className="flex items-center gap-3 py-2" role="status">
          <span className="rounded-full bg-ink-soft px-2.5 py-1 text-micro font-semibold text-white">Demo</span>
          {done ? "A fresh cart. Back to the start." : "Sample shop. Test payments only. Nothing is sent."}
        </p>
        <div className="flex flex-wrap items-center gap-x-5">
          <button type="button" onClick={reset} className={bannerLink}>
            Reset demo
          </button>
          <Link href="/" className={bannerLink}>
            Leave the demo
          </Link>
          <p>
            Built by{" "}
            <a href="https://tekguyz.com" className={`${bannerLink} underline`}>
              TEKGUYZ
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
