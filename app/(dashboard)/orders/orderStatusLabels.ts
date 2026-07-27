const STATUS_KEY_MAP: Record<string, string> = {
  awaiting_payment: 'awaitingPayment',
  awaiting_stock_confirmation: 'awaitingStockConfirmation',
  stock_unavailable: 'stockUnavailable',
  awaiting_payment_method: 'awaitingPaymentMethod',
  awaiting_bank_subtype: 'awaitingBankSubtype',
  awaiting_in_person_subtype: 'awaitingInPersonSubtype',
  awaiting_payment_proof: 'awaitingPaymentProof',
  awaiting_proof_verification: 'awaitingProofVerification',
  awaiting_agent_confirmation: 'awaitingAgentConfirmation',
  payment_proof_received: 'paymentProofReceived',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
};

/**
 * Translates a raw backend order-status string (e.g. "awaiting_payment")
 * into its human-readable label, falling back to the raw value itself for
 * any status not in the map.
 */
export function getRawStatusLabel(t: (path: string) => string, status: string): string {
  const key = STATUS_KEY_MAP[status];
  return key ? t(`orders.rawStatus.${key}`) : status;
}
