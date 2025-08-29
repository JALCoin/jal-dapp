// api/solana.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const UPSTREAM =
  process.env.SOLANA_RPC_PROXY ?? 'https://solana-proxy-production.up.railway.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { data } = await axios.post(UPSTREAM, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    const status = error?.response?.status ?? 500;
    const detail = error?.response?.data ?? error?.message ?? 'Unknown error';
    console.error('[RPC Proxy Error]', detail);

    return res.status(status).json({
      error: 'Mainnet RPC Proxy failed',
      detail,
    });
  }
}
