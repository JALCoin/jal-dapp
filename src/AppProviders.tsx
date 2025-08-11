// src/AppProviders.tsx
import { useMemo, type FC, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletConnectWalletAdapter, WalletConnectWalletName } from "@solana/wallet-adapter-walletconnect";

export const AppProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => (
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3001/api/solana"
      : "https://solana-proxy-production.up.railway.app"
  ), []);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new WalletConnectWalletAdapter({
      options: {
        projectId: "<YOUR_WALLETCONNECT_PROJECT_ID>",   // ← REQUIRED
        relayUrl: "wss://relay.walletconnect.com",      // default, explicit is fine
        metadata: {
          name: "JAL/SOL Dapp",
          description: "Swap SOL→JAL and use utilities",
          url: typeof window !== "undefined" ? window.location.origin : "https://jalsol.com",
          icons: ["https://jalsol.com/icons/icon-512.png"],
        },
        // Solana mainnet chain id (101). The adapter defaults correctly,
        // but setting explicitly can help some wallets.
        chains: ["solana:101"],
      },
    }),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
