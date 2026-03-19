import { supabase } from "./supabase";

export type ReviewRow = {
  id: string;
  product_id: string;
  display_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
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
};

export async function getApprovedReviewsByProductId(productId: string): Promise<ProductReview[]> {
  const { data: reviews, error: reviewsError } = await supabase
    .from("product_reviews")
    .select("id, product_id, display_name, rating, title, body, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  const typedReviews = (reviews ?? []) as ReviewRow[];

  if (!typedReviews.length) {
    return [];
  }

  const reviewIds = typedReviews.map((r) => r.id);

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
      .filter((img) => img.review_id === review.id && img.image_url)
      .map((img) => img.image_url as string),
  }));
}

export async function createReview(input: CreateReviewInput): Promise<ProductReview> {
  const { data: insertedReview, error: reviewError } = await supabase
    .from("product_reviews")
    .insert([
      {
        product_id: input.productId,
        display_name: input.displayName?.trim() || null,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
      },
    ])
    .select("id, product_id, display_name, rating, title, body, created_at")
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

    const { error: imageInsertError } = await supabase.from("review_images").insert(rows);

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
    count > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;

  return {
    count,
    average,
  };
}