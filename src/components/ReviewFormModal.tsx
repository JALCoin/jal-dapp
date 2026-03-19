import { useState } from "react";
import { createReview } from "../lib/reviews";
import { uploadReviewImages } from "../lib/uploads";
import { verifyPurchaseForReview } from "../lib/orders";

export default function ReviewFormModal({
  onClose,
  productId,
  onCreated,
}: {
  onClose: () => void;
  productId: string;
  onCreated?: () => Promise<void> | void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [orderEmail, setOrderEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selected);
  }

  async function handleSubmit() {
    try {
      setError("");
      setSuccess("");

      if (rating < 1 || rating > 5) {
        setError("Please choose a star rating.");
        return;
      }

      if (!title.trim() && !body.trim()) {
        setError("Please enter a title or review.");
        return;
      }

      setSubmitting(true);

      const verification = await verifyPurchaseForReview({
        orderEmail,
        orderId,
        productId,
      });

      const imageUrls = files.length ? await uploadReviewImages(files) : [];

      await createReview({
        productId,
        displayName,
        rating,
        title,
        body,
        imageUrls,
        orderEmail,
        orderId,
        verifiedPurchase: verification.isVerified,
      });

      setSuccess(
        verification.isVerified
          ? "Review submitted as a verified purchase."
          : "Review submitted."
      );

      if (onCreated) {
        await onCreated();
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit review.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="review-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Leave a review"
    >
      <div className="review-modal-panel">
        <button type="button" className="review-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="review-title">Leave a Review</h2>

        <div className="review-field">
          <label className="review-label" htmlFor="review-display-name">
            Display Name
          </label>
          <input
            id="review-display-name"
            className="review-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
          />
        </div>

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
                disabled={submitting}
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
            maxLength={120}
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
            maxLength={1500}
          />
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-order-email">
            Order Email
          </label>
          <input
            id="review-order-email"
            className="review-input"
            value={orderEmail}
            onChange={(e) => setOrderEmail(e.target.value)}
            placeholder="Email used for purchase"
            maxLength={120}
          />
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-order-id">
            Order ID
          </label>
          <input
            id="review-order-id"
            className="review-input"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order number / receipt ID"
            maxLength={120}
          />
        </div>

        <div className="review-field">
          <label className="review-label" htmlFor="review-images">
            Images
          </label>
          <input
            id="review-images"
            className="review-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFiles}
            disabled={submitting}
          />
          {files.length ? (
            <div className="review-upload-count">
              {files.length} image{files.length === 1 ? "" : "s"} selected
            </div>
          ) : null}
        </div>

        {error ? <p className="review-error">{error}</p> : null}
        {success ? <p className="review-success">{success}</p> : null}

        <div className="review-actions">
          <button type="button" className="chip" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="shop-card-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}