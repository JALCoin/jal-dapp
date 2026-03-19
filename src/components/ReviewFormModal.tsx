import { useState } from "react";

export default function ReviewFormModal({
  onClose,
  productId,
}: {
  onClose: () => void;
  productId: string;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit() {
    console.log({
      productId,
      rating,
      title,
      body,
    });

    onClose();
  }

  return (
    <div className="review-modal-overlay" role="dialog" aria-modal="true" aria-label="Leave a review">
      <div className="review-modal-panel">
        <button type="button" className="review-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="review-title">Leave a Review</h2>

        <div className="review-field">
          <label className="review-label">Your Rating</label>
          <div className="review-star-input" aria-label="Choose rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`review-star-btn ${value <= rating ? "is-active" : ""}`}
                onClick={() => setRating(value)}
                aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-title">
            Title
          </label>
          <input
            id="review-title"
            className="review-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline"
          />
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-body">
            Review
          </label>
          <textarea
            id="review-body"
            className="review-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your review here"
            rows={5}
          />
        </div>

        <div className="review-actions">
          <button type="button" className="chip" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="shop-card-primary" onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}