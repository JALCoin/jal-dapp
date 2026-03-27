import express from "express";
import axios from "axios";

const router = express.Router();
const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

router.post("/", async (req, res) => {
  try {
    const result = await axios.post(SOLANA_RPC_URL, req.body, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    });

    res.status(200).json(result.data);
  } catch (err) {
    console.error("RPC Proxy Error:", err?.response?.data || err.message);

    res.status(err?.response?.status || 500).json({
      error: "Proxy failed",
      detail: err?.response?.data || err.message,
    });
  }
});

export default router;