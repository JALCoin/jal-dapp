// src/components/JupiterSwapEmbed.tsx
import { useEffect, useRef } from "react";

type Props = {
  inputMint?: string;                 // default: SOL
  outputMint: string;                 // e.g. your JAL mint
  onLoaded?: () => void;
  height?: number | string;           // <-- NEW
  className?: string;                 // <-- optional styling override
  style?: React.CSSProperties;        // <-- optional inline styles
};

export default function JupiterSwapEmbed({
  inputMint = "So11111111111111111111111111111111111111112",
  outputMint,
  onLoaded,
  height,
  className,
  style,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const url = new URL("https://jup.ag/swap");
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("theme", "dark");
  url.searchParams.set("preferLegacyRoute", "true");

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const handle = () => onLoaded?.();
    el.addEventListener("load", handle);
    return () => el.removeEventListener("load", handle);
  }, [onLoaded]);

  const h = typeof height === "number" ? `${height}px` : height ?? "680px";

  return (
    <iframe
      ref={iframeRef}
      title="Swap"
      src={url.toString()}
      className={className ?? "modal-iframe"}
      style={{ width: "100%", height: h, border: 0, borderRadius: 12, ...style }}
      loading="eager"
      referrerPolicy="no-referrer"
      allow="clipboard-read; clipboard-write; fullscreen"
    />
  );
}
