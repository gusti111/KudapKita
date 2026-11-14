import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/domain/constants/order-status';
import type { OrderStatus, PaymentStatus } from '@/domain/entities/Order';

const orderTone: Record<OrderStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800', WAITING_PAYMENT: 'bg-orange-100 text-orange-800',
  PREPARING: 'bg-sky-100 text-sky-800', READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-800',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-rose-100 text-rose-800', CANCELLED: 'bg-stone-200 text-stone-700',
};
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderTone[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === 'PAID' ? 'bg-green-100 text-green-800' : status === 'REJECTED' || status === 'REFUNDED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{PAYMENT_STATUS_LABELS[status]}</span>;
}
