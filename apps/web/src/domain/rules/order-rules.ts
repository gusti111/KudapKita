import type { OrderRequestInput } from '@/domain/entities/Order';

export function validateOrderRequest(input: OrderRequestInput): string | null {
  if (input.customerName.trim().length < 2) return 'Nama pelanggan minimal 2 karakter.';
  const digits = input.customerWhatsApp.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) return 'Nomor WhatsApp belum valid.';
  if (input.items.length < 1) return 'Keranjang masih kosong.';
  if (input.items.length > 6) return 'Maksimal 6 jenis produk per permintaan pada MVP.';
  if (input.items.some((item) => item.quantity < 1 || item.quantity > 50)) return 'Jumlah produk tidak valid.';
  if (input.fulfillmentMethod === 'DELIVERY' && !input.deliveryAddress?.trim()) return 'Alamat pengantaran wajib diisi.';
  return null;
}
