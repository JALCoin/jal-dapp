// src/pages/Shop.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getActiveProducts, type Product } from "../data/products";

type Filter = "all" | "physical" | "digital";

function ProductModal({
  p,
  onClose,
}: {
  p: Product;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Focus close button on open
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <>
      <button
        className="product-modal-backdrop"
        aria-label="Close product"
        onClick={onClose}
      />
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={p.title}
      >
        <div className="product-modal-inner">
          <button
            ref={closeRef}
            type="button"
            className="product-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>

          <div className="product-modal-grid">
            <div className="product-modal-media" aria-label="Product image">
              {p.image ? (
                <img className="product-modal-img" src={p.image} alt={p.title} />
              ) : (
                <div className="product-modal-img product-modal-img--empty" />
              )}
            </div>

            <div className="product-modal-info">
              <div className="product-modal-head">
                <h2 className="product-modal-title">{p.title}</h2>
                <div className="product-modal-meta">
                  <span className={`product-badge status-${p.status}`}>
                    {p.status === "active" ? "Live" : p.status === "coming_soon" ? "Soon" : "—"}
                  </span>
                  <span className="product-modal-kind">
                    {p.kind === "physical" ? "Physical" : "Digital"}
                  </span>
                </div>
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
            </div>
          </div>
        </div>
      </section>
    </>
  );
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
    <button
      type="button"
      className="product-card"
      aria-label={`Open ${p.title}`}
      onClick={() => onOpen(p)}
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
          <span key={l.href} className="chip chip-btn" aria-hidden="true">
            {l.label}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function Shop() {
  const [filter, setFilter] = useState<Filter>("all");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  const products = useMemo(() => {
    const all = getActiveProducts();
    if (filter === "all") return all;
    return all.filter((p) => p.kind === filter);
  }, [filter]);

  // ESC closes modal
  useEffect(() => {
    if (!openProduct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProduct(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProduct]);

  // Lock scroll while modal is open
  useEffect(() => {
    if (!openProduct) return;
    document.body.setAttribute("data-modal-open", "true");
    return () => document.body.removeAttribute("data-modal-open");
  }, [openProduct]);

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
              <ProductCard key={p.id} p={p} onOpen={setOpenProduct} />
            ))}
          </div>
        </section>
      </div>

      {openProduct ? (
        <ProductModal p={openProduct} onClose={() => setOpenProduct(null)} />
      ) : null}
    </main>
  );
}