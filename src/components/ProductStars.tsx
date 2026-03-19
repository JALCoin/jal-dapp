export default function ProductStars({
  rating = 0,
  count = 0,
}: {
  rating?: number;
  count?: number;
}) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;

  const rounded = Math.round(safeRating * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded % 1 === 0.5;

  return (
    <div
      className="product-stars"
      aria-label={`${safeRating.toFixed(1)} out of 5 stars from ${safeCount} review${safeCount === 1 ? "" : "s"}`}
    >
      {"★★★★★".split("").map((_, i) => {
        if (i < full) {
          return (
            <span key={i} className="star full" aria-hidden="true">
              ★
            </span>
          );
        }

        if (i === full && half) {
          return (
            <span key={i} className="star half" aria-hidden="true">
              ★
            </span>
          );
        }

        return (
          <span key={i} className="star empty" aria-hidden="true">
            ★
          </span>
        );
      })}

      <span className="product-rating-text">
        {safeCount > 0 ? `${safeRating.toFixed(1)} (${safeCount})` : "No reviews yet"}
      </span>
    </div>
  );
}