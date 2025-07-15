// server.cjs
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://mainnet.helius-rpc.com',
    changeOrigin: true,
    pathRewrite: { '^/': '/' },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Authorization', 'Bearer 5d848b93-48b5-4565-bcef-9dc42e5ac6b2');
    },
  })
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Helius proxy running at http://localhost:${PORT}`);
});
