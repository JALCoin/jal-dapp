import type { FC } from 'react';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

export const AppProviders: FC<{ children: React.ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => 'http://localhost:3000', []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const onError = (error: any) => console.error('Wallet error:', error);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
