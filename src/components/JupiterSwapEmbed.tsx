// src/components/JupiterSwapEmbed.tsx
import { useEffect, useRef } from "react";

type Props = {
  inputMint?: string;                 // default: SOL
  outputMint: string;                 // the token to receive (e.g., JAL)
  onLoaded?: () => void;
};

export default function JupiterSwapEmbed({
  inputMint = "So11111111111111111111111111111111111111112",
  outputMint,
  onLoaded,
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

  return (
    <iframe
      ref={iframeRef}
      title="Swap"
      src={url.toString()}
      className="modal-iframe"
      loading="eager"
      referrerPolicy="no-referrer"
      allow="clipboard-read; clipboard-write; fullscreen"
    />
  );
}
