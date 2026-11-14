import type { OrderStatus, PaymentStatus } from '@/domain/entities/Order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  REQUESTED: 'Menunggu pemeriksaan',
  WAITING_PAYMENT: 'Menunggu pembayaran',
  PREPARING: 'Sedang disiapkan',
  READY_FOR_PICKUP: 'Siap diambil',
  OUT_FOR_DELIVERY: 'Sedang dikirim',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum dibayar',
  WAITING_VERIFICATION: 'Menunggu verifikasi',
  PAID: 'Terverifikasi',
  REJECTED: 'Pembayaran ditolak',
  REFUNDED: 'Dikembalikan',
};
