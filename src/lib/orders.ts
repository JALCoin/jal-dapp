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
      reason: "Order email, receipt number, and product are required.",
    };
  }

  const { data, error } = await supabase.rpc("verify_review_purchase", {
    p_order_email: email,
    p_receipt_number: orderId,
    p_product_id: productId,
  });

  if (error) {
    console.error("verifyPurchaseForReview error:", error.message);
    return {
      isVerified: false,
      reason: "Verification failed.",
    };
  }

  if (!data) {
    return {
      isVerified: false,
      reason: "No matching paid order found.",
    };
  }

  return { isVerified: true };
}