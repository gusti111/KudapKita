export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Harga dikonfirmasi admin';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  const normalized = number.replace(/\D/g, '');
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
