import express from "express";
import cors from "cors";
import solanaProxy from "./solanaProxy.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/solana", solanaProxy);

app.listen(PORT, () => {
  console.log("Proxy running on port", PORT);
});