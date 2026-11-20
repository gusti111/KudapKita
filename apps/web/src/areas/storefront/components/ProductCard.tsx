import { useState } from 'react';
import { ArrowUpRight, Check, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicProduct } from '@/domain/entities/Product';
import { useCart } from '@/app/providers/CartProvider';
import { formatRupiah } from '@/shared/utils/format';
import { ProductImage } from '@/shared/components/ui/ProductImage';

export function ProductCard({ product, onQuickView }: { product: PublicProduct; onQuickView?: (product: PublicProduct) => void }) {
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState('');
  const unavailable = product.availability === 'SOLD_OUT';
  const preOrder = product.availability === 'PRE_ORDER';

  function add() {
    if (unavailable) return;
    const added = addItem(product);
    setFeedback(added ? 'Ditambahkan' : 'Batas keranjang tercapai');
    window.setTimeout(() => setFeedback(''), 1800);
  }

  return (
    <article className="product-card group flex h-full min-w-0 flex-col overflow-hidden border border-stroke shadow-soft">
      <div className="product-card__media relative">
        <Link to={`/menu?item=${encodeURIComponent(product.slug)}`} className="block" aria-label={`Lihat detail ${product.name}`}>
          <ProductImage name={product.name} category={product.categoryName} src={product.imagePath || product.imageGallery?.[0]} className="product-card__image" />
        </Link>
        <span className="product-card__category">{product.categoryName || 'Jajanan'}</span>
        <span className={`product-card__availability ${unavailable ? 'is-sold-out' : preOrder ? 'is-preorder' : 'is-available'}`}>
          {unavailable ? 'Habis' : preOrder ? 'Pre-order' : 'Tersedia'}
        </span>
        {onQuickView && (
          <button type="button" className="product-card__quick-view" onClick={() => onQuickView(product)} aria-label={`Lihat detail ${product.name}`}>
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-4.5">
        <div className="min-w-0">
          <Link to={`/menu?item=${encodeURIComponent(product.slug)}`} className="product-card__title line-clamp-2 hover:text-terracotta">{product.name}</Link>
          <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{product.shortDescription || 'Camilan pilihan dari KudapKita.'}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-muted">Harga satuan</span>
            <strong className="mt-1 block text-sm font-extrabold text-cocoa sm:text-base">{formatRupiah(product.price)}</strong>
          </div>
          <button type="button" disabled={unavailable} onClick={add} className="product-card__add" aria-label={`Tambah ${product.name} ke keranjang`}>
            {feedback === 'Ditambahkan' ? <Check size={15} /> : <Plus size={15} />}
            <span>{feedback || (unavailable ? 'Habis' : 'Tambah')}</span>
            {!feedback && <ShoppingBag size={14} className="hidden sm:block" />}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{feedback}</span>
      </div>
    </article>
  );
}
