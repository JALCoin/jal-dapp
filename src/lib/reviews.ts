import { supabase } from "./supabase";

export type ReviewRow = {
  id: string;
  product_id: string;
  display_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  order_email: string | null;
  order_id: string | null;
  verified_purchase: boolean;
};

export type ReviewImageRow = {
  id: string;
  review_id: string;
  image_url: string | null;
  created_at: string;
};

export type ProductReview = ReviewRow & {
  images: string[];
};

export type CreateReviewInput = {
  productId: string;
  displayName?: string;
  rating: number;
  title?: string;
  body?: string;
  imageUrls?: string[];
  orderEmail?: string;
  orderId?: string;
  verifiedPurchase?: boolean;
};

export async function getReviewsByProductId(productId: string): Promise<ProductReview[]> {
  const cleanProductId = productId.trim();

  if (!cleanProductId) {
    return [];
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from("product_reviews")
    .select(
      "id, product_id, display_name, rating, title, body, created_at, order_email, order_id, verified_purchase"
    )
    .eq("product_id", cleanProductId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const typedReviews = (reviews ?? []) as ReviewRow[];

  if (!typedReviews.length) {
    return [];
  }

  const reviewIds = typedReviews.map((review) => review.id);

  const { data: reviewImages, error: imagesError } = await supabase
    .from("review_images")
    .select("id, review_id, image_url, created_at")
    .in("review_id", reviewIds);

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  const typedImages = (reviewImages ?? []) as ReviewImageRow[];

  return typedReviews.map((review) => ({
    ...review,
    images: typedImages
      .filter((image) => image.review_id === review.id && typeof image.image_url === "string")
      .map((image) => image.image_url as string),
  }));
}

export async function createReview(input: CreateReviewInput): Promise<ProductReview> {
  const rating = Number(input.rating);

  if (!input.productId.trim()) {
    throw new Error("Product ID is required.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const { data: insertedReview, error: reviewError } = await supabase
    .from("product_reviews")
    .insert([
      {
        product_id: input.productId.trim(),
        display_name: input.displayName?.trim() || null,
        rating,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
        order_email: input.orderEmail?.trim().toLowerCase() || null,
        order_id: input.orderId?.trim() || null,
        verified_purchase: input.verifiedPurchase ?? false,
      },
    ])
    .select(
      "id, product_id, display_name, rating, title, body, created_at, order_email, order_id, verified_purchase"
    )
    .single();

  if (reviewError || !insertedReview) {
    throw new Error(reviewError?.message || "Failed to create review.");
  }

  const imageUrls = (input.imageUrls ?? []).filter(Boolean);

  if (imageUrls.length) {
    const rows = imageUrls.map((url) => ({
      review_id: insertedReview.id,
      image_url: url,
    }));

    const { error: imageInsertError } = await supabase
      .from("review_images")
      .insert(rows);

    if (imageInsertError) {
      throw new Error(imageInsertError.message);
    }
  }

  return {
    ...(insertedReview as ReviewRow),
    images: imageUrls,
  };
}

export function getReviewSummary(reviews: ProductReview[]) {
  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
      : 0;

  return {
    count,
    average,
  };
}