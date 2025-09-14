import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PROGRAM_ID as TMETA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

interface Props {
  mint: string;
  connection: Connection;                 // ← we will ONLY use this RPC (Helius)
  onClose: () => void;
  onSuccess?: (mint: string) => void;
  templateMetadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
  };
}

const TokenFinalizerModal: FC<Props> = ({
  mint,
  connection,
  onClose,
  onSuccess,
  templateMetadata,
}) => {
  const { publicKey, sendTransaction, wallet } = useWallet();

  // form state
  const [imageUri, setImageUri] = useState(templateMetadata?.image ?? "");
  const [name, setName] = useState(templateMetadata?.name ?? "");
  const [symbol, setSymbol] = useState(templateMetadata?.symbol ?? "");
  const [description, setDescription] = useState(
    templateMetadata?.description ?? ""
  );
  const [metadataUri, setMetadataUri] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [imageSizeKB, setImageSizeKB] = useState(0);

  // action state
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [txSig, setTxSig] = useState<string | null>(null);
  const IMAGE_SIZE_LIMIT_KB = 500;

  const mintPk = useMemo(() => new PublicKey(mint), [mint]);

  const normalizeHttp = (uri: string) =>
    uri.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`
      : uri;

  // lightweight check of the image (size & type)
  useEffect(() => {
    const run = async () => {
      const src = normalizeHttp(imageUri || "");
      if (!src.startsWith("http")) {
        setMimeType("");
        setImageSizeKB(0);
        return;
      }
      try {
        const res = await fetch(src, { cache: "no-store" });
        const blob = await res.blob();
        setMimeType(blob.type || "image/png");
        setImageSizeKB(+((blob.size ?? 0) / 1024).toFixed(2));
      } catch {
        setMimeType("");
        setImageSizeKB(0);
      }
    };
    run();
  }, [imageUri]);

  if (!wallet?.adapter || !publicKey) return null;

  const downloadMetadataJson = () => {
    if (!imageUri) return;
    if (imageSizeKB > IMAGE_SIZE_LIMIT_KB) {
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

  const attachMetadata = async () => {
    try {
      setBusy(true);
      setStatus("idle");

      // If metadata already exists, short-circuit
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TMETA_PROGRAM_ID.toBuffer(), mintPk.toBuffer()],
        TMETA_PROGRAM_ID
      );
      const existing = await connection.getAccountInfo(metadataPda, "confirmed");
      if (existing) {
        setStatus("success");
        onSuccess?.(mint);
        return;
      }

      // Minimal Metaplex Metadata
      const data = {
        name,
        symbol,
        uri: metadataUri, // should point to your uploaded metadata.json
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      };

      const ix = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPda,
          mint: mintPk,
          mintAuthority: publicKey,
          payer: publicKey,
          updateAuthority: publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data,
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("finalized");

      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      }).add(ix);

      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);

      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      // Verify creation
      const created = await connection.getAccountInfo(metadataPda, "confirmed");
      if (!created) throw new Error("Metadata account not found after submit.");

      setStatus("success");
      onSuccess?.(mint);
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const disableAttach =
    busy ||
    !name ||
    !symbol ||
    !metadataUri ||
    (imageUri && imageSizeKB > IMAGE_SIZE_LIMIT_KB);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="delete-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="text-xl font-bold mb-3 text-center">Turn Into Currency</h2>

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
          </li>

          <li>
            2. Paste the uploaded image URI:
            <input
              type="text"
              value={imageUri}
              onChange={(e) => setImageUri(e.target.value)}
              placeholder="ipfs://... or https://gateway.lighthouse.storage/ipfs/..."
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
            />
            <input
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="button"
              onClick={downloadMetadataJson}
              disabled={!!imageUri && imageSizeKB > IMAGE_SIZE_LIMIT_KB}
            >
              Download metadata.json
            </button>
          </li>

          <li>
            4. Upload your metadata file to IPFS and paste the URI:
            <input
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://... (points to metadata.json)"
            />
          </li>

          <li>
            <button
              className="button"
              onClick={attachMetadata}
              disabled={disableAttach}
            >
              {busy ? "Attaching…" : `Attach Metadata to ${mint.slice(0, 4)}…`}
            </button>
            <p className="text-xs text-yellow-700 mt-1">
              ⚠️ Approve Phantom immediately after clicking. Delay = failure.
            </p>
          </li>
        </ol>

        {status === "success" && txSig && (
          <div className="text-green-600 text-xs mt-4 space-y-1">
            <p>✅ Metadata successfully attached.</p>
            <a
              href={`https://solscan.io/tx/${txSig}`}
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
                href={normalizeHttp(metadataUri)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                Metadata URI ↗
              </a>
            )}
          </div>
        )}

        {status === "error" && (
          <p className="text-red-500 text-xs mt-3">
            ❌ Metadata attachment failed. Double check IPFS URI and retry.
          </p>
        )}

        <p className="text-[var(--jal-muted)] text-xs mt-3">
          Once attached, this metadata becomes permanent on-chain.
        </p>
      </div>
    </div>
  );
};

export default TokenFinalizerModal;
