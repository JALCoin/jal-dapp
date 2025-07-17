export const config = {
  runtime: 'edge', // optional: enables edge function on Vercel
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    const solanaRes = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'jal-sol-client', // ✅ some Solana RPCs require this
        'Accept': '*/*',
      },
      body: JSON.stringify(body),
    });

    if (!solanaRes.ok) {
      const errBody = await solanaRes.text();
      console.error('Solana RPC failed:', solanaRes.status, errBody);
      return new Response(errBody, { status: solanaRes.status });
    }

    const result = await solanaRes.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Proxy error:', err.message || err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Error' }), {
      status: 500,
    });
  }
}
