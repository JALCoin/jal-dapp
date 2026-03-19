import { supabase } from "./supabase";

export type ReviewVerificationInput = {
  orderEmail?: string;
  orderId?: string;
  productId: string;
};

export type ReviewVerificationResult = {
  isVerified: boolean;
  reason?: string;
};

export async function verifyPurchaseForReview(
  input: ReviewVerificationInput
): Promise<ReviewVerificationResult> {
  const email = input.orderEmail?.trim().toLowerCase();
  const orderId = input.orderId?.trim();
  const productId = input.productId?.trim();

  if (!email || !orderId || !productId) {
    return {
      isVerified: false,
      reason: "Order email, order ID, and product are required.",
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("stripe_session_id, customer_email, product_id, status")
    .eq("stripe_session_id", orderId)
    .eq("customer_email", email)
    .eq("product_id", productId)
    .eq("status", "paid")
    .limit(1);

  if (error) {
    console.error("verifyPurchaseForReview error:", error.message);
    return {
      isVerified: false,
      reason: "Verification failed.",
    };
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) {
    return {
      isVerified: false,
      reason: "No matching paid order found.",
    };
  }

  return { isVerified: true };
}