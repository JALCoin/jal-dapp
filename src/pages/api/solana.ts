// pages/api/solana.ts
import type { VercelRequest, VercelResponse } from 'vercel';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const response = await axios.post(
      'https://api.mainnet-beta.solana.com',
      req.body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('RPC Proxy Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'RPC Proxy Error', detail: error.response?.data });
  }
}
