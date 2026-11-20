import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Check, ChevronDown, Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { PublicProduct } from '@/domain/entities/Product';
import { getPublishedProducts } from '@/data/repositories/catalog.repository';
import { ProductCard } from '@/areas/storefront/components/ProductCard';
import { DemoBanner } from '@/areas/storefront/components/DemoBanner';
import { ProductImage } from '@/shared/components/ui/ProductImage';
import { useAuth } from '@/app/providers/AuthProvider';
import { useCart } from '@/app/providers/CartProvider';
import { formatRupiah } from '@/shared/utils/format';

export function CatalogPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sort, setSort] = useState('featured');
  const [searchParams, setSearchParams] = useSearchParams();
  const { firebaseReady } = useAuth();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublishedProducts()
      .then((result) => { if (active) setProducts(result); })
      .catch(() => { if (active) setError('Katalog belum dapat dimuat. Periksa koneksi internet, lalu coba lagi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const initialCategory = searchParams.get('category');
    if (initialCategory) setCategory(initialCategory);
  }, [searchParams]);

  const categories = useMemo(() => ['Semua', ...new Set(products.map((item) => item.categoryName).filter(Boolean))], [products]);
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
    const rows = products.filter((item) => {
      const matchesCategory = category === 'Semua' || item.categoryName === category;
      const searchable = `${item.name} ${item.shortDescription} ${item.categoryName}`.toLocaleLowerCase('id-ID');
      return matchesCategory && searchable.includes(normalizedSearch);
    });
    if (sort === 'price-asc') rows.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
    if (sort === 'price-desc') rows.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return rows;
  }, [products, category, search, sort]);

  const selectedProduct = products.find((item) => item.slug === searchParams.get('item'));
  function selectProduct(product: PublicProduct) {
    const next = new URLSearchParams(searchParams);
    next.set('item', product.slug);
    setSearchParams(next, { preventScrollReset: true });
  }
  function closeDetail() {
    const next = new URLSearchParams(searchParams);
    next.delete('item');
    setSearchParams(next, { preventScrollReset: true });
  }

  return (
    <section className="catalog-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="catalog-heading">
        <div>
          <span className="eyebrow">Dari dapur KudapKita</span>
          <h1 className="section-title mt-2 font-serif text-4xl font-bold text-cocoa sm:text-5xl">Pilih kudapan favoritmu.</h1>
          <p className="section-copy mt-3 text-sm leading-7 text-muted">Jelajahi menu yang sedang ditampilkan. Ketersediaan dan total akhir tetap dikonfirmasi oleh admin sebelum pembayaran.</p>
        </div>
        <div className="catalog-count"><strong>{loading ? '—' : filtered.length}</strong><span>produk ditemukan</span></div>
      </div>
      {!firebaseReady && <div className="mt-6"><DemoBanner /></div>}

      <div className="catalog-toolbar mt-8 rounded-2xl border border-stroke bg-white p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="catalog-search relative block">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari risol, onde-onde, atau kategori…" className="h-12 w-full rounded-xl border border-stroke bg-cream/65 pl-11 pr-10 text-sm outline-none transition focus:border-terracotta focus:ring-4 focus:ring-terracotta/10" aria-label="Cari produk" />
            {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-white" aria-label="Hapus pencarian"><X size={15}/></button>}
          </label>
          <label className="relative block">
            <ArrowDownUp size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-stroke bg-white pl-10 pr-9 text-sm font-medium text-cocoa outline-none focus:border-terracotta" aria-label="Urutkan produk">
              <option value="featured">Urutan unggulan</option><option value="price-asc">Harga terendah</option><option value="price-desc">Harga tertinggi</option><option value="name">Nama A–Z</option>
            </select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filter kategori">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><SlidersHorizontal size={14}/> Kategori</span>
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => { setCategory(item); const next = new URLSearchParams(searchParams); if (item === 'Semua') next.delete('category'); else next.set('category', item); setSearchParams(next, { preventScrollReset: true }); }} className={`category-filter ${category === item ? 'is-active' : ''}`} aria-pressed={category === item}>
              {category === item && <Check size={13}/>} {item}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => { setError(''); setLoading(true); getPublishedProducts().then(setProducts).catch(() => setError('Katalog masih belum dapat dimuat.')).finally(() => setLoading(false)); }} className="ml-2 font-bold underline">Coba lagi</button></div>}
      {loading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-stroke bg-white"><div className="skeleton-block aspect-[4/3]"/><div className="space-y-3 p-4"><div className="skeleton-block h-4 w-2/3"/><div className="skeleton-block h-3 w-full"/><div className="skeleton-block h-9 w-1/2"/></div></div>)}</div>
      ) : filtered.length ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} onQuickView={selectProduct}/>)}</div>
      ) : (
        <div className="catalog-empty mt-10 rounded-3xl border border-dashed border-stroke bg-white p-10 text-center sm:p-14"><span className="text-4xl" aria-hidden="true">🧺</span><h2 className="mt-4 font-serif text-2xl font-bold text-cocoa">Belum ada hasil yang cocok.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Coba kata kunci lain atau tampilkan seluruh kategori untuk menemukan menu yang tersedia.</p><button type="button" onClick={() => { setSearch(''); setCategory('Semua'); setSort('featured'); setSearchParams({}, { preventScrollReset: true }); }} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-cocoa px-5 text-sm font-bold text-white">Atur ulang filter</button></div>
      )}

      {selectedProduct && <ProductDetailDialog product={selectedProduct} onClose={closeDetail}/>} 
    </section>
  );
}

function ProductDetailDialog({ product, onClose }: { product: PublicProduct; onClose: () => void }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.imagePath || product.imageGallery?.[0] || '');
  const [feedback, setFeedback] = useState('');
  const unavailable = product.availability === 'SOLD_OUT';
  const gallery = [...new Set([product.imagePath, ...(product.imageGallery ?? [])].filter((value): value is string => Boolean(value)))].slice(0, 5);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  function add() {
    if (!addItem(product, quantity)) { setFeedback('Batas keranjang tercapai.'); return; }
    setFeedback(`${quantity} ${product.name} ditambahkan ke keranjang.`);
  }

  return (
    <div className="product-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <button type="button" className="product-dialog__close" onClick={onClose} aria-label="Tutup detail produk"><X size={19}/></button>
        <div className="grid md:grid-cols-[1fr_1fr]">
          <div className="product-dialog__media"><ProductImage name={product.name} category={product.categoryName} src={activeImage || undefined} className="product-dialog__image" />{gallery.length > 1 && <div className="product-dialog__thumbnails">{gallery.map((image, index) => <button key={image} type="button" onClick={() => setActiveImage(image)} className={activeImage === image ? 'is-active' : ''} aria-label={`Tampilkan foto ${index + 1}`} aria-pressed={activeImage === image}><img src={image} alt="" loading="lazy"/></button>)}</div>}</div>
          <div className="flex flex-col p-6 sm:p-8">
            <span className="eyebrow">{product.categoryName || 'Menu KudapKita'}</span>
            <h2 id="product-dialog-title" className="mt-3 font-serif text-3xl font-bold text-cocoa">{product.name}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{product.shortDescription || 'Camilan pilihan dari KudapKita.'}</p>
            <strong className="mt-6 text-2xl font-extrabold text-cocoa">{formatRupiah(product.price)}</strong>
            <span className={`mt-3 inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${unavailable ? 'bg-rose-50 text-rose-700' : product.availability === 'PRE_ORDER' ? 'bg-amber-50 text-amber-800' : 'bg-sage-50 text-sage-700'}`}>
              {unavailable ? 'Sedang habis' : product.availability === 'PRE_ORDER' ? 'Tersedia melalui pre-order' : 'Tersedia di katalog'}
            </span>
            <p className="mt-4 text-xs leading-5 text-muted">Ketersediaan akhir dan total pembayaran dikonfirmasi admin setelah permintaan pesanan diterima.</p>
            <div className="mt-auto pt-7">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted">Jumlah</span>
                <div className="flex items-center rounded-xl border border-stroke bg-cream/50 p-1">
                  <button type="button" className="quantity-step" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Kurangi jumlah">−</button>
                  <span className="min-w-9 text-center text-sm font-bold text-cocoa" aria-live="polite">{quantity}</span>
                  <button type="button" className="quantity-step" onClick={() => setQuantity((value) => Math.min(50, value + 1))} aria-label="Tambah jumlah">+</button>
                </div>
              </div>
              <button type="button" disabled={unavailable} onClick={add} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-5 text-sm font-bold text-white transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-stone-300"><ShoppingBag size={17}/> Tambahkan ke keranjang</button>
              {feedback && <p role="status" className="mt-3 text-xs font-semibold text-sage">{feedback}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
