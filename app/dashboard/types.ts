export interface Order {
  number: string;
  customer: string;
  part: string;
  reference: string;
  supplier: string;
  price: number;
  created_at: string;
  time: string;
  has_proof: boolean;
  payment_method?: string;
  requires_proof?: boolean;
}

export interface ApprovedOrder {
  number: string;
  customer: string;
  part: string;
  price: number;
  time: string;
}
