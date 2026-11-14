import { Info } from 'lucide-react';
export function DemoBanner() {
  return <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><Info size={16} className="mt-0.5 shrink-0"/><span><strong>Mode data contoh.</strong> Katalog yang terlihat bukan data produk final, harga belum ditetapkan, dan checkout hanya dapat aktif setelah Firebase dikonfigurasi.</span></div>;
}
