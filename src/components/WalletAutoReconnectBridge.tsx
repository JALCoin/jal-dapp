import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Nudges the wallet adapter to reconnect when users return from the Phantom app
 * (or any wallet) back to your site, on *any* route.
 *
 * It calls `connect()` only when safe (not already connected/connecting).
 * Errors are swallowed — many adapters require a user gesture, so this is a best‑effort.
 */
export default function WalletAutoReconnectBridge() {
  const { connected, connecting, connect, wallet } = useWallet();
  const tickingRef = useRef(false);

  useEffect(() => {
    const tryReconnect = async () => {
      // Debounce rapid focus/visibility bursts
      if (tickingRef.current) return;
      tickingRef.current = true;
      try {
        if (!connected && !connecting) {
          await connect();
        }
      } catch {
        // ignore: user canceled or adapter requires gesture
      } finally {
        // micro delay so multiple events in a row coalesce
        setTimeout(() => {
          tickingRef.current = false;
        }, 150);
      }
    };

    const onFocus = () => void tryReconnect();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tryReconnect();
    };

    // When the adapter object changes (user switches wallets), attempt a nudge
    void tryReconnect();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [connected, connecting, connect, wallet]);

  return null;
}
