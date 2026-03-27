import express from "express";
import cors from "cors";
import solanaProxy from "./solanaProxy.js";

const app = express();
const PORT = process.env.PORT || 8080; // Railway expects this

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "solana-proxy",
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/solana", solanaProxy);

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});