export type ReviewVerificationInput = {
  orderEmail?: string;
  orderId?: string;
  productId: string;
};

export type ReviewVerificationResult = {
  isVerified: boolean;
  reason?: string;
};

/*
  Placeholder verification layer.

  Current mode:
  - verification is NOT yet connected to Stripe or a secure backend
  - always returns false
  - keeps architecture honest until a real order source is wired
*/
export async function verifyPurchaseForReview(
  input: ReviewVerificationInput
): Promise<ReviewVerificationResult> {
  const hasEmail = Boolean(input.orderEmail?.trim());
  const hasOrderId = Boolean(input.orderId?.trim());

  if (!hasEmail || !hasOrderId) {
    return {
      isVerified: false,
      reason: "Order email and order ID are required for verification.",
    };
  }

  return {
    isVerified: false,
    reason: "Purchase verification is not connected yet.",
  };
}