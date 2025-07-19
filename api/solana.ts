import type { VercelRequest, VercelResponse } from 'vercel';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { data } = await axios.post(
      'https://solana-proxy-production.up.railway.app',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[RPC Proxy Error]', error?.response?.data || error?.message);
    return res.status(500).json({
      error: 'Mainnet RPC Proxy failed',
      detail: error?.response?.data || error?.message,
    });
  }
}
