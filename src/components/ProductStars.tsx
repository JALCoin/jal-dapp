export default function ProductStars({
  rating = 0,
  count = 0,
}: {
  rating?: number;
  count?: number;
}) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <div className="product-stars">
      {"★★★★★".split("").map((_, i) => {
        if (i < full) return <span key={i} className="star full">★</span>;
        if (i === full && half) return <span key={i} className="star half">★</span>;
        return <span key={i} className="star empty">★</span>;
      })}
      <span className="product-rating-text">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}