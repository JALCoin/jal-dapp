// src/pages/Sell.txs
import { Link } from "react-router-dom";

export default function Sell() {
  return (
    <main className="landing-simple">
      <div className="landing-simple-inner">
        <h1 className="hero-title">Sell with JAL</h1>
        <p className="hero-sub">Create, list, or manage what you sell.</p>

        <div className="bss-row bss-row--big" style={{ marginTop: 12 }}>
          {/* Generators = token/NFT creation flows */}
          <Link className="bss-btn buy" to="/crypto-generator/engine#step1">GENERATORS</Link>

          {/* Courses sold for JAL — point to your store (can refine later) */}
          <Link className="bss-btn swap" to="/?panel=shop">COURSES</Link>

          {/* Vault = balances and activity */}
          <Link className="bss-btn sell" to="/?panel=vault">VAULT</Link>
        </div>

        <p className="hint">Generators: mint your currency/NFT. Courses: pay with JAL. Vault: view assets.</p>
      </div>
    </main>
  );
}
