// src/utils/TokenFinalizerModal.tsx
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { finalizeTokenMetadata } from "../utils/finalizeTokenMetadata";
import { verifyTokenMetadataAttached } from "../utils/verifyTokenMetadataAttached";
import { createSignerFromWalletAdapter } from "@metaplex-foundation/umi-signer-wallet-adapters";

interface Props {
  mint: string;
  connection: Connection;
  onClose: () => void;
  onSuccess?: (mint: string) => void;
  templateMetadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
  };
}

const IMAGE_SIZE_LIMIT_KB = 500;

const TokenFinalizerModal: FC<Props> = ({
  mint,
  connection,
  onClose,
  onSuccess,
  templateMetadata,
}) => {
  const { wallet } = useWallet();

  // ----- form state
  const [imageUri, setImageUri] = useState(templateMetadata?.image ?? "");
  const [name, setName] = useState(templateMetadata?.name ?? "");
  const [symbol, setSymbol] = useState(templateMetadata?.symbol ?? "");
  const [description, setDescription] = useState(
    templateMetadata?.description ?? ""
  );
  const [metadataUri, setMetadataUri] = useState("");

  // ----- derived/probed info (for feedback)
  const [mimeType, setMimeType] = useState("");
  const [imageSizeKB, setImageSizeKB] = useState(0);

  // ----- action/UX state
  const [attaching, setAttaching] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const mintPk = useMemo(() => new PublicKey(mint), [mint]);

  const toHttp = (uri: string) =>
    uri?.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`
      : uri;

  // Probe the image (type + size) so users see if it’s too large
  useEffect(() => {
    const probe = async () => {
      const src = toHttp(imageUri || "");
      if (!src || !/^https?:\/\//i.test(src)) {
        setMimeType("");
        setImageSizeKB(0);
        return;
      }
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error("Image fetch failed");
        const blob = await res.blob();
        setMimeType(blob.type || "image/png");
        setImageSizeKB(+((blob.size ?? 0) / 1024).toFixed(2));
      } catch {
        setMimeType("");
        setImageSizeKB(0);
      }
    };
    probe();
  }, [imageUri]);

  if (!wallet?.adapter) return null;

  const handleDownloadMetadata = () => {
    if (imageUri && imageSizeKB > IMAGE_SIZE_LIMIT_KB) {
      alert("Image too large for token metadata (max 500KB).");
      return;
    }
    const json = {
      name,
      symbol,
      description,
      image: imageUri,
      properties: {
        files: [{ uri: imageUri, type: mimeType || "image/png" }],
        category: "image",
      },
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metadata.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachMetadata = async () => {
    setAttaching(true);
    setStatus("idle");
    setTxSignature(null);

    try {
      const signer = createSignerFromWalletAdapter(wallet.adapter);

      const sig = await finalizeTokenMetadata({
        signer,
        mintAddress: mintPk,
        metadataUri,
        name,
        symbol,
      });
      setTxSignature(sig);

      // quick on-chain verification (reads Metadata PDA)
      const verified = await verifyTokenMetadataAttached(connection, mintPk);
      if (!verified?.isAttached) {
        throw new Error("Metadata verification failed.");
      }

      setStatus("success");
      onSuccess?.(mint);
    } catch (e) {
      console.error("[TokenFinalizer] attach failed:", e);
      setStatus("error");
    } finally {
      setAttaching(false);
    }
  };

  const disableAttach =
    attaching ||
    !name.trim() ||
    !symbol.trim() ||
    !metadataUri.trim() ||
    (Boolean(imageUri) && imageSizeKB > IMAGE_SIZE_LIMIT_KB);

  return (
    <div className="modal-overlay">
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="finalize-title">
        <button className="delete-btn" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 id="finalize-title" className="text-xl font-bold mb-3 text-center">
          Turn Into Currency
        </h2>

        <ol className="space-y-4 text-sm">
          <li>
            1. Upload your <strong>token image</strong> to{" "}
            <a
              href="https://www.lighthouse.storage/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              lighthouse.storage
            </a>
            .
          </li>

          <li>
            2. Paste the uploaded image URI:
            <input
              type="text"
              value={imageUri}
              onChange={(e) => setImageUri(e.target.value)}
              placeholder="ipfs://... or https://gateway.lighthouse.storage/ipfs/..."
              aria-label="Image URI"
            />
            {imageSizeKB > 0 && (
              <p
                className={`text-xs ${
                  imageSizeKB > IMAGE_SIZE_LIMIT_KB
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                File type: {mimeType || "unknown"} | Size: {imageSizeKB} KB
              </p>
            )}
          </li>

          <li>
            3. Fill in your token identity:
            <input
              placeholder="Token Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Token name"
            />
            <input
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              aria-label="Token symbol"
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Token description"
            />
            <button
              className="button"
              onClick={handleDownloadMetadata}
              disabled={Boolean(imageUri) && imageSizeKB > IMAGE_SIZE_LIMIT_KB}
            >
              Download metadata.json
            </button>
          </li>

          <li>
            4. Upload your <code>metadata.json</code> to IPFS and paste the URI:
            <input
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://... (points to metadata.json)"
              aria-label="Metadata URI"
            />
          </li>

          <li>
            <button
              className="button"
              onClick={handleAttachMetadata}
              disabled={disableAttach}
              aria-busy={attaching || undefined}
            >
              {attaching ? "Attaching…" : `Attach Metadata to ${mint.slice(0, 4)}…`}
            </button>
            <p className="text-xs text-yellow-700 mt-1" aria-live="polite">
              ⚠️ Approve Phantom immediately after clicking. Delay = failure.
            </p>
          </li>
        </ol>

        {/* success */}
        {status === "success" && txSignature && (
          <div className="text-green-600 text-xs mt-4 space-y-1" aria-live="polite">
            <p>✅ Metadata successfully attached.</p>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View Transaction ↗
            </a>
            <a
              href={`https://solscan.io/address/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View Mint ↗
            </a>
            {metadataUri && (
              <a
                href={toHttp(metadataUri)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                Metadata URI ↗
              </a>
            )}
          </div>
        )}

        {/* error */}
        {status === "error" && (
          <p className="text-red-500 text-xs mt-3" aria-live="assertive">
            ❌ Metadata attachment failed. Double-check the IPFS URI and try again.
          </p>
        )}

        <p className="text-[var(--jal-muted)] text-xs mt-3">
          Once attached, this metadata becomes permanent on-chain (use an update authority responsibly).
        </p>
      </div>
    </div>
  );
};

export default TokenFinalizerModal;
