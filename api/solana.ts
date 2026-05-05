import type { VercelRequest, VercelResponse } from "@vercel/node";

type RpcErrorBody = {
  error?: unknown;
};

async function readRpcBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function rpcErrorDetail(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "error" in body) {
    return (body as RpcErrorBody).error ?? fallback;
  }

  return body ?? fallback;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const response = await fetch('https://solana-proxy-production.up.railway.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await readRpcBody(response);

    if (!response.ok) {
      const detail = rpcErrorDetail(data, response.statusText);
      console.error('[RPC Proxy Error]', detail);
      return res.status(response.status).json({
        error: 'Mainnet RPC Proxy failed',
        detail,
      });
    }

    return res.status(200).json(data);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('[RPC Proxy Error]', detail);
    return res.status(500).json({
      error: 'Mainnet RPC Proxy failed',
      detail,
    });
  }
}
