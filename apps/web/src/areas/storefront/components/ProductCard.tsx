import { Link } from 'react-router-dom';
import { Plus, ShoppingBag } from 'lucide-react';
import type { PublicProduct } from '@/domain/entities/Product';
import { useCart } from '@/app/providers/CartProvider';
import { formatRupiah } from '@/shared/utils/format';

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const unavailable = product.availability === 'SOLD_OUT';
  return <article className="group overflow-hidden rounded-2xl border border-stroke bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card">
    <Link to={`/menu?item=${encodeURIComponent(product.slug)}`} className="block">
      <div className="product-art relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br from-[#f4dfc5] via-[#f7eadb] to-[#e4c5a3]">
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-cocoa">{product.categoryName}</span>
        <div className="product-orb grid h-24 w-24 place-items-center rounded-full border border-white/70 bg-white/35 text-4xl shadow-inner">🥮</div>
        <span className="absolute bottom-3 text-[10px] font-medium tracking-wide text-cocoa/60">FOTO PRODUK MENYUSUL</span>
      </div>
    </Link>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2"><h3 className="font-semibold text-cocoa">{product.name}</h3>{product.availability === 'PRE_ORDER' && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Pre-order</span>}</div>
      <p className="mt-1 min-h-10 text-xs leading-5 text-muted">{product.shortDescription}</p>
      <div className="mt-4 flex items-center justify-between gap-2"><div className="text-sm font-bold text-cocoa">{formatRupiah(product.price)}</div>
        <button type="button" disabled={unavailable} onClick={() => addItem(product)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-cocoa px-3 text-xs font-semibold text-white hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-stone-300" aria-label={`Tambah ${product.name} ke keranjang`}><Plus size={15}/><span className="hidden sm:inline">Tambah</span><ShoppingBag size={14} className="sm:hidden"/></button>
      </div>
      {unavailable && <p className="mt-2 text-xs font-medium text-rose-700">Sedang habis</p>}
    </div>
  </article>;
}
