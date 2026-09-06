export const CHECKOUT_ATTEMPT_ID_KEY = "heypoint_checkout_attempt_id";
export const CHECKOUT_ATTEMPT_FINGERPRINT_KEY =
  "heypoint_checkout_attempt_fingerprint";

export function clearCheckoutAttempt() {
  sessionStorage.removeItem(CHECKOUT_ATTEMPT_ID_KEY);
  sessionStorage.removeItem(CHECKOUT_ATTEMPT_FINGERPRINT_KEY);
}

export function cartFingerprint(items: Array<{ productId: string; quantity: number }>) {
  return items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join("|");
}

export function getCheckoutAttemptId(fingerprint: string) {
  const storedId = sessionStorage.getItem(CHECKOUT_ATTEMPT_ID_KEY);
  const storedFingerprint = sessionStorage.getItem(CHECKOUT_ATTEMPT_FINGERPRINT_KEY);
  if (storedId && storedFingerprint === fingerprint) return storedId;

  const nextId = crypto.randomUUID();
  sessionStorage.setItem(CHECKOUT_ATTEMPT_ID_KEY, nextId);
  sessionStorage.setItem(CHECKOUT_ATTEMPT_FINGERPRINT_KEY, fingerprint);
  return nextId;
}
