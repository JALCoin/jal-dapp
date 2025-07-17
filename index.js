import express from 'express';
import cors from 'cors';
import solanaProxy from './solanaProxy.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/solana', solanaProxy);

app.listen(PORT, () => {
  console.log(`✅ JAL RPC Proxy running at http://localhost:${PORT}`);
});
