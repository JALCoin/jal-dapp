// src/pages/Shop.tsx
import { useMemo, useState } from "react";
import { getActiveProducts, type Product } from "../data/products";

type Filter = "all" | "physical" | "digital";

function ProductCard({ p }: { p: Product }) {
  const badge =
    p.status === "active" ? "LIVE" : p.status === "coming_soon" ? "SOON" : "—";

  return (
    <article className="product-card" aria-label={p.title}>
      {p.image ? (
        <div className="product-media" aria-label="Product image">
          <img
            className="product-img"
            src={p.image}
            alt={p.title}
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="product-top">
        <div className="product-title-row">
          <h3 className="product-title">{p.title}</h3>
          <span className={`product-badge status-${p.status}`}>{badge}</span>
        </div>

        {p.priceNote ? <div className="product-price">{p.priceNote}</div> : null}

        <p className="product-summary">{p.summary}</p>

        {p.tags?.length ? (
          <div className="product-tags" aria-label="Product tags">
            {p.tags.slice(0, 5).map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-actions" aria-label="Product links">
        {p.links.slice(0, 2).map((l) => (
          <a
            key={l.href}
            className="chip"
            href={l.href}
            target="_blank"
            rel="noreferrer"
          >
            {l.label}
          </a>
        ))}
      </div>
    </article>
  );
}

export default function Shop() {
  const [filter, setFilter] = useState<Filter>("all");

  const products = useMemo(() => {
    const all = getActiveProducts();
    if (filter === "all") return all;
    return all.filter((p) => p.kind === filter);
  }, [filter]);

  return (
    <main className="home-shell" aria-label="Shop">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">Shop</h1>

          <p className="home-lead">
            Sovereign storefront — direct checkout will live here. Etsy stays as a small
            outbound link while we build the full store pipeline.
          </p>

          <div className="home-links">
            <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">
              jalsol.com
            </a>
            <a
              className="chip"
              href="https://jalrelics.etsy.com"
              target="_blank"
              rel="noreferrer"
            >
              Etsy (small link)
            </a>
          </div>

          <div className="shop-controls" aria-label="Shop filters">
            <button
              type="button"
              className={`chip chip-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`chip chip-btn ${filter === "physical" ? "is-active" : ""}`}
              onClick={() => setFilter("physical")}
            >
              Physical
            </button>
            <button
              type="button"
              className={`chip chip-btn ${filter === "digital" ? "is-active" : ""}`}
              onClick={() => setFilter("digital")}
            >
              Digital
            </button>
          </div>

          <div className="shop-grid" aria-label="Products grid">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}