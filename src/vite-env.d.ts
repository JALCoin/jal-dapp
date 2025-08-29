/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    // shims you set in viteBufferFix.ts
    Buffer: typeof import("buffer").Buffer;
    process: any;
    // optional RPC override you read in code
    __SOLANA_RPC_ENDPOINT__?: string;
  }

  // allow assigning to globalThis.global
  var global: typeof globalThis;
}

/** Vite env you read in App.tsx */
interface ImportMetaEnv {
  readonly VITE_WC_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
