import { useEffect } from "react";

export default function BootLoader({
  seconds = 5,
  onDone,
}: {
  seconds?: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const ms = Math.max(0, Math.floor(seconds * 1000));
    const t = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(t);
  }, [seconds, onDone]);

  return (
    <div className="boot-screen" role="status" aria-live="polite" aria-label="Loading">
      <img
        className="boot-logo"
        src="/JALSOL1.gif"
        alt="JAL/SOL"
        draggable={false}
      />
      <div className="boot-sub">Loading…</div>
    </div>
  );
}