type ReviewItem = {
  id: string;
  display_name?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  created_at?: string;
  images?: string[];
};

function formatReviewDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (!reviews.length) {
    return <p className="shop-review-empty">No reviews yet.</p>;
  }

  return (
    <div className="shop-review-list">
      {reviews.map((review) => (
        <article key={review.id} className="shop-review-card">
          <div className="shop-review-head">
            <div>
              <div className="shop-review-name">
                {review.display_name?.trim() || "Anonymous"}
              </div>
              {review.created_at ? (
                <div className="shop-review-date">{formatReviewDate(review.created_at)}</div>
              ) : null}
            </div>

            <div className="shop-review-stars" aria-label={`${review.rating} star review`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`shop-review-star ${value <= review.rating ? "is-active" : ""}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {review.title ? <h4 className="shop-review-title">{review.title}</h4> : null}
          {review.body ? <p className="shop-review-body">{review.body}</p> : null}

          {review.images?.length ? (
            <div className="shop-review-images">
              {review.images.map((src, index) => (
                <img
                  key={`${review.id}-${index}`}
                  src={src}
                  alt={`Review image ${index + 1}`}
                  className="shop-review-image"
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}