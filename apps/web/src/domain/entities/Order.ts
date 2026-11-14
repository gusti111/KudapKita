import type { CartLine } from './CartLine';

export type OrderStatus =
  | 'REQUESTED' | 'WAITING_PAYMENT' | 'PREPARING' | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'WAITING_VERIFICATION' | 'PAID' | 'REJECTED' | 'REFUNDED';
export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';

export type OrderRequestInput = {
  customerName: string;
  customerWhatsApp: string;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string;
  customerNote?: string;
  items: CartLine[];
};

export type OrderRecord = OrderRequestInput & {
  id: string;
  createdByUid: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  source: 'ONLINE';
  createdAt: unknown;
  confirmedTotal?: number | null;
  paymentMethod?: 'BANK_TRANSFER' | 'QRIS';
};
