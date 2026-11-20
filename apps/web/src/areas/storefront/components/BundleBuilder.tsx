import { useMemo, useState } from 'react';
import { ImageOff, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { PublicProduct } from '@/domain/entities/Product';
import { useCart } from '@/app/providers/CartProvider';
import { getPublicProductPhoto } from '@/shared/utils/product-image';

export function BundleBuilder({ products }: { products: PublicProduct[] }) {
  const { addItem } = useCart();
  const [packSize, setPackSize] = useState<4 | 5 | 10>(5);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState('');

  const selectableProducts = useMemo(
    () => products.filter((product) => product.isPublished && product.availability !== 'SOLD_OUT'),
    [products],
  );
  const totalSelected = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);

  function choosePackSize(nextSize: 4 | 5 | 10) {
    setPackSize(nextSize);
    setQuantities({});
    setNotice('');
  }

  function changeQuantity(productId: string, delta: number) {
    setQuantities((current) => {
      const currentValue = current[productId] ?? 0;
      const nextValue = Math.max(0, Math.min(packSize, currentValue + delta));
      const nextTotal = Object.entries(current).reduce((total, [id, quantity]) => total + (id === productId ? 0 : quantity), 0) + nextValue;
      if (nextTotal > packSize) return current;
      return { ...current, [productId]: nextValue };
    });
    setNotice('');
  }

  function addBundleToCart() {
    if (totalSelected !== packSize) return;
    selectableProducts.forEach((product) => {
      const quantity = quantities[product.id] ?? 0;
      for (let index = 0; index < quantity; index += 1) addItem(product);
    });
    setNotice(`Pilihan ${packSize} pcs sudah dimasukkan ke keranjang. Harga paket akan dikonfirmasi pengelola.`);
    setQuantities({});
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8" aria-labelledby="bundle-title">
      <div className="overflow-hidden rounded-[1.8rem] border border-[#E6D6C3] bg-[#F8F1E7] shadow-soft">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[.8fr_1.2fr] lg:p-9">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <span className="eyebrow">Pilihan paket KudapKita</span>
              <h2 id="bundle-title" className="mt-3 max-w-md font-serif text-3xl font-bold leading-tight text-cocoa sm:text-4xl">Racik sendiri camilan favoritmu.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Pilih beberapa menu dalam satu permintaan. Harga dan ketersediaan akan dikonfirmasi pengelola.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <button type="button" onClick={() => choosePackSize(4)} aria-pressed={packSize === 4} className={`rounded-2xl border p-3 text-left transition ${packSize === 4 ? 'border-cocoa bg-white shadow-soft' : 'border-[#E2D0BA] bg-white/55 hover:bg-white'}`}>
                <span className="text-[9px] font-bold uppercase tracking-[.12em] text-terracotta">Paket kecil</span>
                <strong className="mt-1 block font-serif text-2xl text-cocoa">4 pcs</strong>
                <span className="mt-1 block text-[10px] text-muted">Harga dikonfirmasi</span>
              </button>
              <button type="button" onClick={() => choosePackSize(5)} aria-pressed={packSize === 5} className={`rounded-2xl border p-3 text-left transition ${packSize === 5 ? 'border-cocoa bg-white shadow-soft' : 'border-[#E2D0BA] bg-white/55 hover:bg-white'}`}>
                <span className="text-[9px] font-bold uppercase tracking-[.12em] text-terracotta">Paket sedang</span>
                <strong className="mt-1 block font-serif text-2xl text-cocoa">5 pcs</strong>
                <span className="mt-1 block text-[10px] text-muted">Harga dikonfirmasi</span>
              </button>
              <button type="button" onClick={() => choosePackSize(10)} aria-pressed={packSize === 10} className={`rounded-2xl border p-3 text-left transition ${packSize === 10 ? 'border-cocoa bg-white shadow-soft' : 'border-[#E2D0BA] bg-white/55 hover:bg-white'}`}>
                <span className="text-[9px] font-bold uppercase tracking-[.12em] text-terracotta">Paket berbagi</span>
                <strong className="mt-1 block font-serif text-2xl text-cocoa">10 pcs</strong>
                <span className="mt-1 block text-[10px] text-muted">Harga dikonfirmasi</span>
              </button>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white bg-white p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-serif text-xl font-bold text-cocoa">Pilih isi paket</h3><p className="mt-1 text-xs text-muted">Pilih tepat {packSize} buah dari menu berikut.</p></div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold tabular-nums ${totalSelected === packSize ? 'bg-[#E7F1E6] text-[#315D39]' : 'bg-[#F3EADF] text-cocoa'}`}>{totalSelected} / {packSize} pcs</span>
            </div>
            {selectableProducts.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {selectableProducts.map((product) => {
                const qty = quantities[product.id] ?? 0;
                const productPhoto = getPublicProductPhoto(product.imagePath);
                return <div key={product.id} className="flex items-center gap-3 rounded-xl border border-stroke p-2.5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#F1E8DC] text-muted">{productPhoto ? <img src={productPhoto} alt={`Foto ${product.name}`} className="h-full w-full rounded-lg object-cover" loading="lazy"/> : <ImageOff size={18}/>}</div>
                  <div className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-cocoa">{product.name}</span><span className="mt-1 block text-[10px] text-muted">{product.price == null ? 'Harga dikonfirmasi pengelola' : `${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)} / pcs`}</span></div>
                  <div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={() => changeQuantity(product.id, -1)} disabled={qty === 0} aria-label={`Kurangi ${product.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-stroke text-cocoa disabled:opacity-35"><Minus size={13}/></button><span className="w-4 text-center text-xs font-bold tabular-nums text-cocoa">{qty}</span><button type="button" onClick={() => changeQuantity(product.id, 1)} disabled={totalSelected >= packSize} aria-label={`Tambah ${product.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-stroke text-cocoa disabled:opacity-35"><Plus size={13}/></button></div>
                </div>;
              })}
            </div> : <p className="mt-5 rounded-xl bg-[#F7F1E9] p-4 text-xs leading-5 text-muted">Menu belum tersedia. Owner perlu memuat katalog dasar dan mempublikasikan produk melalui dashboard.</p>}
            <div className="mt-4 flex flex-col gap-3 border-t border-stroke pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] leading-5 text-muted">Harga, kemasan, dan ketersediaan mengikuti konfirmasi pengelola.</p>
              <button type="button" onClick={addBundleToCart} disabled={totalSelected !== packSize} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cocoa px-5 text-xs font-bold text-white transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-stone-300"><ShoppingBag size={15}/> Masukkan paket</button>
            </div>
            {notice && <p role="status" className="mt-3 rounded-lg bg-[#EAF3E8] px-3 py-2 text-xs font-semibold text-[#315D39]">{notice}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
