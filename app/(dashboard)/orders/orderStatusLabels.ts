/** Every raw backend order status (orders.status in db/schema.sql) — distinct
 *  from STATUS_LABELS in OrderDetailModal.tsx, which only covers the 4
 *  frontend bucket keys. Used for the "View Order" modal, which fetches the
 *  full order row (including the raw status) via GET /admin/orders/:number. */
export const RAW_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment Setup',
  awaiting_stock_confirmation: 'Awaiting Stock Confirmation',
  stock_unavailable: 'Stock Unavailable',
  awaiting_payment_method: 'Awaiting Payment Method',
  awaiting_bank_subtype: 'Awaiting Bank Details',
  awaiting_in_person_subtype: 'Awaiting In-Person Details',
  awaiting_payment_proof: 'Awaiting Payment Proof',
  awaiting_proof_verification: 'Verifying Payment Proof',
  awaiting_agent_confirmation: 'Awaiting Agent Confirmation',
  payment_proof_received: 'Payment Proof Received',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
