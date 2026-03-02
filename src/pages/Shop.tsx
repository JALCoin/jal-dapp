// src/pages/Shop.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getActiveProducts, type Product } from "../data/products";

type Filter = "all" | "physical" | "digital";

function ProductModal({
  p,
  onClose,
}: {
  p: Product;
  onClose: () => void;
}) {
  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // lock scroll
  useEffect(() => {
    document.body.setAttribute("data-modal-open", "true");
    return () => document.body.removeAttribute("data-modal-open");
  }, []);

  const badge =
    p.status === "active" ? "Live" : p.status === "coming_soon" ? "Soon" : "—";

  const modal = (
    <div className="product-modal-layer" role="dialog" aria-modal="true" aria-label={p.title}>
      {/* Backdrop (click to close) */}
      <button
        className="product-modal-backdrop"
        aria-label="Close product"
        onClick={onClose}
      />

      {/* Panel */}
      <section className="product-modal-panel" aria-label="Product details">
        <button
          type="button"
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>

        <div className="product-modal-grid">
          {/* Media */}
          <div className="product-modal-media">
            {p.image ? (
              <img className="product-modal-img" src={p.image} alt={p.title} />
            ) : (
              <div className="product-modal-img-placeholder" aria-label="No image" />
            )}
          </div>

          {/* Details */}
          <div className="product-modal-details">
            <div className="product-modal-title-row">
              <h2 className="product-modal-title">{p.title}</h2>
              <span className={`product-badge status-${p.status}`}>{badge}</span>
            </div>

            {p.priceNote ? <div className="product-modal-price">{p.priceNote}</div> : null}
            <p className="product-modal-summary">{p.summary}</p>

            {p.tags?.length ? (
              <div className="product-tags" aria-label="Product tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="product-modal-actions" aria-label="Product links">
              {p.links.map((l) => (
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

            <div className="product-modal-footnote">
              Tip: press <span className="kbd">ESC</span> to close.
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}

function ProductCard({
  p,
  onOpen,
}: {
  p: Product;
  onOpen: (p: Product) => void;
}) {
  const badge =
    p.status === "active" ? "Live" : p.status === "coming_soon" ? "Soon" : "—";

  return (
    <article
      className="product-card product-card-clickable"
      aria-label={p.title}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // If user clicked a link/button inside the card, don't open modal
        const el = e.target as HTMLElement;
        if (el.closest("a,button")) return;
        onOpen(p);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(p);
      }}
    >
      {p.image ? (
        <div className="product-media" aria-label="Product image">
          <img className="product-img" src={p.image} alt={p.title} loading="lazy" />
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
            {p.tags.slice(0, 4).map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="product-actions"
        aria-label="Product links"
        onClick={(e) => e.stopPropagation()}
      >
        {p.links.slice(0, 2).map((l) => (
          <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
    </article>
  );
}

export default function Shop() {
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Product | null>(null);

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
            Sovereign storefront — direct checkout will live here. Etsy stays as an outbound link
            while we build the full store pipeline.
          </p>

          <div className="home-links">
            <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">
              jalsol.com
            </a>
            <a className="chip" href="https://jalrelics.etsy.com" target="_blank" rel="noreferrer">
              Etsy
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
              <ProductCard key={p.id} p={p} onOpen={setActive} />
            ))}
          </div>
        </section>
      </div>

      {/* FULLSCREEN OVERLAY */}
      {active ? <ProductModal p={active} onClose={() => setActive(null)} /> : null}
    </main>
  );
}