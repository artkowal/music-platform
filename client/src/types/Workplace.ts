export interface Workplace {
  workplace_id: number;
  name: string;
  color_hex: string;
  payment_type?: 'per_lesson' | 'monthly' | 'none';
  payment_amount?: number | null;
  sort_order?: number;
}