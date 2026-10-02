// ── Admin ─────────────────────────────────────────────────
export interface AdminRecord {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── Delivery Staff ────────────────────────────────────────
export interface StaffRecord {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  is_active: boolean;
  last_assigned_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NewStaffInput {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
}

// ── Product ───────────────────────────────────────────────
export interface ProductRecord {
  id: number;
  label: string;
  size: string;
  price: number;
}
// ── Stock ─────────────────────────────────────────────────
export interface StockRecord {
  id: number;
  product_id: number;
  quantity: number;
  threshold: number;
  updated_at: Date;
}

export interface StockWithProduct extends StockRecord {
  label: string;
  size: string;
  price: number;
}

// ── Order ─────────────────────────────────────────────────
export type OrderType = 'walk_in' | 'call';
export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: number;
  order_type: OrderType;
  consumer_name: string;
  consumer_phone: string;
  consumer_address: string | null;
  assigned_staff_id: number | null;
  status: OrderStatus;
  total: number;
  notes: string | null;
  placed_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export interface NewOrderInput {
  orderType: OrderType;
  consumerName: string;
  consumerPhone: string;
  consumerAddress?: string;
  notes?: string;
  items: OrderItem[];
}

// ── Delivery ──────────────────────────────────────────────
export type DeliveryStatus = 'assigned' | 'out_for_delivery' | 'delivered' | 'complaint';
export type ComplaintType = 'wrong_item' | 'damaged' | 'incomplete' | 'other';

export interface DeliveryRecord {
  id: number;
  order_id: number;
  staff_id: number;
  status: DeliveryStatus;
  sms_sent_at: Date | null;
  sms_confirmed_at: Date | null;
  auto_confirmed_at: Date | null;
  has_complaint: boolean;
  complaint_type: ComplaintType | null;
  complaint_note: string | null;
  complaint_resolved: boolean;
  complaint_resolved_at: Date | null;
  assigned_at: Date;
  delivered_at: Date | null;
  updated_at: Date;
}

// ── Sale ──────────────────────────────────────────────────
export type SaleType = 'walk_in' | 'delivery';

export interface SaleRecord {
  id: number;
  order_id: number;
  total: number;
  payment_method: string;
  sale_type: SaleType;
  paid_at: Date;
}

// ── SMS Log ───────────────────────────────────────────────
export type SmsStatus = 'sent' | 'failed' | 'pending';

export interface SmsLogRecord {
  id: number;
  order_id: number | null;
  delivery_id: number | null;
  recipient: string;
  message: string;
  status: SmsStatus;
  provider_ref: string | null;
  sent_at: Date;
}

// ── Staff Stats ───────────────────────────────────────────
export interface StaffDeliveryStats {
  staff_id: number;
  staff_name: string;
  total_deliveries: number;
  week_deliveries: number;
}
