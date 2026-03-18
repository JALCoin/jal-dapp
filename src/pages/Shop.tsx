// src/pages/Shop.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getActiveProducts, type Product } from "../data/products";

type Filter = "all" | "physical" | "digital";
type SortMode = "featured" | "title-asc" | "title-desc";

function getStatusLabel(status: Product["status"]) {
  if (status === "active") return "Live";
  if (status === "coming_soon") return "Soon";
  return "—";
}

function getPrimaryLink(p: Product) {
  if (!p.links?.length) return null;

  const priority = [
    "donate",
    "support",
    "buy now",
    "checkout",
    "pre-order",
    "preorder",
    "stripe",
    "shop now",
    "order now",
    "enquire",
    "inquire",
    "view",
  ];

  const scored = [...p.links].sort((a, b) => {
    const aIndex = priority.findIndex((x) => a.label.toLowerCase().includes(x));
    const bIndex = priority.findIndex((x) => b.label.toLowerCase().includes(x));
    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;
    return safeA - safeB;
  });

  return scored[0] ?? null;
}

function getSecondaryLinks(p: Product) {
  const primary = getPrimaryLink(p);
  return p.links.filter((l) => l.href !== primary?.href).slice(0, 2);
}

function ProductModal({
  p,
  onClose,
}: {
  p: Product;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.setAttribute("data-modal-open", "true");
    return () => document.body.removeAttribute("data-modal-open");
  }, []);

  const badge = getStatusLabel(p.status);
  const primaryLink = getPrimaryLink(p);
  const secondaryLinks = getSecondaryLinks(p);

  const modal = (
    <div
      className="product-modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      <button
        className="product-modal-backdrop"
        aria-label="Close product"
        onClick={onClose}
      />

      <section className="product-modal-panel shop-modal-panel" aria-label="Product details">
        <button
          type="button"
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>

        <div className="product-modal-grid shop-modal-grid">
          <div className="product-modal-media shop-modal-media">
            {p.image ? (
              <img className="product-modal-img" src={p.image} alt={p.title} />
            ) : (
              <div className="product-modal-img-placeholder" aria-label="No image" />
            )}
          </div>

          <div className="product-modal-details shop-modal-details">
            <div className="shop-modal-kicker-row">
              <span className="shop-modal-kicker">
                {p.kind === "physical" ? "Physical" : "Digital"}
              </span>
              <span className={`product-badge status-${p.status}`}>{badge}</span>
            </div>

            <h2 className="product-modal-title shop-modal-title">{p.title}</h2>

            {p.priceNote ? (
              <div className="product-modal-price shop-modal-price">{p.priceNote}</div>
            ) : null}

            <p className="product-modal-summary shop-modal-summary">{p.summary}</p>

            {p.tags?.length ? (
              <div className="product-tags shop-modal-tags" aria-label="Product tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="shop-modal-actions" aria-label="Product links">
              {primaryLink ? (
                <a
                  className="shop-primary-action"
                  href={primaryLink.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {primaryLink.label}
                </a>
              ) : null}

              {secondaryLinks.length ? (
                <div className="shop-secondary-actions">
                  {secondaryLinks.map((l) => (
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
              ) : null}
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
  const badge = getStatusLabel(p.status);
  const primaryLink = getPrimaryLink(p);
  const secondaryLinks = getSecondaryLinks(p);

  return (
    <article
      className="product-card product-card-clickable shop-product-card"
      aria-label={p.title}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("a,button")) return;
        onOpen(p);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(p);
        }
      }}
    >
      <div className="shop-card-image-wrap">
        {p.image ? (
          <div className="product-media shop-product-media" aria-label="Product image">
            <img
              className="product-img shop-product-img"
              src={p.image}
              alt={p.title}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="product-media shop-product-media shop-product-placeholder"
            aria-label="No image"
          />
        )}

        <div className="shop-card-badges">
          <span className={`product-badge status-${p.status}`}>{badge}</span>
        </div>
      </div>

      <div className="product-top shop-card-body">
        <div className="shop-card-meta">
          <span className="shop-card-kind">
            {p.kind === "physical" ? "Physical" : "Digital"}
          </span>
        </div>

        <div className="product-title-row shop-card-title-row">
          <h3 className="product-title shop-card-title">{p.title}</h3>
        </div>

        {p.priceNote ? <div className="product-price shop-card-price">{p.priceNote}</div> : null}

        <p className="product-summary shop-card-summary">{p.summary}</p>

        {p.tags?.length ? (
          <div className="product-tags shop-card-tags" aria-label="Product tags">
            {p.tags.slice(0, 4).map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="product-actions shop-card-actions"
        aria-label="Product links"
        onClick={(e) => e.stopPropagation()}
      >
        {primaryLink ? (
          <a
            className="shop-card-primary"
            href={primaryLink.href}
            target="_blank"
            rel="noreferrer"
          >
            {primaryLink.label}
          </a>
        ) : null}

        {secondaryLinks.length ? (
          <div className="shop-card-secondary">
            {secondaryLinks.map((l) => (
              <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function Shop() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [active, setActive] = useState<Product | null>(null);

  const supportProducts = useMemo(() => {
    const all = getActiveProducts();

    const getPrice = (p: Product) =>
      Number((p.priceNote ?? "").replace(/[^0-9.]/g, "")) || 0;

    return all
      .filter((p) => p.isSupport === true)
      .sort((a, b) => getPrice(a) - getPrice(b));
  }, []);

  const storeProducts = useMemo(() => {
    const all = getActiveProducts().filter((p) => p.isSupport !== true);

    let filtered = all;

    if (filter !== "all") {
      filtered = all.filter((p) => p.kind === filter);
    }

    switch (sort) {
      case "title-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case "title-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case "featured":
      default:
        filtered.sort((a, b) => {
          const score = (p: Product) => {
            if (p.status === "active") return 0;
            if (p.status === "coming_soon") return 1;
            return 2;
          };

          return score(a) - score(b) || a.title.localeCompare(b.title);
        });
        break;
    }

    return filtered;
  }, [filter, sort]);

  return (
    <main className="home-shell shop-shell" aria-label="Shop">
      <div className="home-wrap shop-wrap">
        <section className="card machine-surface panel-frame shop-panel">
          <div className="shop-header">
            <div className="shop-header-main">
              <p className="shop-eyebrow">JALSOL Storefront</p>
              <h1 className="home-title shop-title">Shop</h1>

              <p className="home-lead shop-lead">
                Stripe-powered checkout for direct system entry and product acquisition.
              </p>
            </div>

            <div className="shop-header-links">
              <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">
                jalsol.com
              </a>
            </div>
          </div>

          <section className="shop-section" aria-label="System entry">
            <div className="shop-section-head">
              <div>
                <p className="shop-section-kicker">System Entry</p>
                <h2 className="shop-section-title">Donate</h2>
                <p className="shop-section-copy">
                  Direct contribution into the JALSOL system through fixed donation tiers.
                </p>
              </div>
            </div>

            <div className="shop-grid shop-grid-support" aria-label="Donation tiers">
              {supportProducts.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setActive} />
              ))}
            </div>
          </section>

          <section className="shop-section" aria-label="Store products">
            <div className="shop-section-head">
              <div>
                <p className="shop-section-kicker">Store Products</p>
                <h2 className="shop-section-title">Buy</h2>
                <p className="shop-section-copy">
                  Physical releases, collectibles, and private allocation pieces.
                </p>
              </div>
            </div>

            <div className="shop-toolbar" aria-label="Shop controls">
              <div className="shop-filter-group">
                <button
                  type="button"
                  className={`chip chip-btn shop-filter-btn ${filter === "all" ? "is-active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`chip chip-btn shop-filter-btn ${filter === "physical" ? "is-active" : ""}`}
                  onClick={() => setFilter("physical")}
                >
                  Physical
                </button>
                <button
                  type="button"
                  className={`chip chip-btn shop-filter-btn ${filter === "digital" ? "is-active" : ""}`}
                  onClick={() => setFilter("digital")}
                >
                  Digital
                </button>
              </div>

              <div className="shop-toolbar-right">
                <div className="shop-count" aria-label="Product count">
                  {storeProducts.length} {storeProducts.length === 1 ? "product" : "products"}
                </div>

                <label className="shop-sort" aria-label="Sort products">
                  <span className="shop-sort-label">Sort</span>
                  <select
                    className="shop-sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                  >
                    <option value="featured">Featured</option>
                    <option value="title-asc">Title A–Z</option>
                    <option value="title-desc">Title Z–A</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="shop-grid" aria-label="Products grid">
              {storeProducts.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={setActive} />
              ))}
            </div>
          </section>
        </section>
      </div>

      {active ? <ProductModal p={active} onClose={() => setActive(null)} /> : null}
    </main>
  );
}