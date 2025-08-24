import { useEffect } from "react";

/**
 * Watches the DOM for any wallet modal (Solana adapter or WalletConnect)
 * and toggles body[data-wallet-visible="true"] so your CSS can freeze/blur
 * the underlying app while the wallet UI is open.
 *
 * No props. Mount once near the app root (inside WalletModalProvider).
 */
const MODAL_SELECTORS = [
  ".wallet-adapter-modal",
  ".wallet-adapter-modal-container",
  ".wcm-modal", // WalletConnect (Web3Modal)
];

export default function WalletUiVisibilityBridge() {
  useEffect(() => {
    const setFlag = (visible: boolean) => {
      const b = typeof document !== "undefined" ? document.body : null;
      if (!b) return;
      if (visible) b.setAttribute("data-wallet-visible", "true");
      else b.removeAttribute("data-wallet-visible");
    };

    const isAnyWalletModalOpen = () =>
      MODAL_SELECTORS.some((sel) => !!document.querySelector(sel));

    // Initial check
    setFlag(isAnyWalletModalOpen());

    // Observe DOM for modal open/close
    const mo = new MutationObserver(() => setFlag(isAnyWalletModalOpen()));
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "inert", "aria-hidden"],
    });

    // Visibility fallback (covers edge cases on iOS)
    const onVisibility = () => setFlag(isAnyWalletModalOpen());
    document.addEventListener("visibilitychange", onVisibility);

    // Safety: periodic micro‑poll in case a wallet injects outside observed subtree
    const poll = window.setInterval(() => {
      setFlag(isAnyWalletModalOpen());
    }, 1000);

    return () => {
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
      setFlag(false);
    };
  }, []);

  return null;
}
