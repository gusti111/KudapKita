import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { PublicProduct } from '@/domain/entities/Product';
import { getPublishedProducts } from '@/data/repositories/catalog.repository';
import { ProductCard } from '@/areas/storefront/components/ProductCard';
import { DemoBanner } from '@/areas/storefront/components/DemoBanner';
import { useAuth } from '@/app/providers/AuthProvider';

export function CatalogPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { firebaseReady } = useAuth();
  useEffect(() => { let active = true; getPublishedProducts().then((items) => { if (active) setProducts(items); }).catch(() => { if (active) setError('Katalog belum dapat dimuat. Silakan muat ulang halaman.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const categories = useMemo(() => ['Semua', ...new Set(products.map((item) => item.categoryName))], [products]);
  const filtered = products.filter((item) => (category === 'Semua' || item.categoryName === category) && `${item.name} ${item.shortDescription}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="max-w-2xl"><span className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">Katalog</span><h1 className="mt-2 font-serif text-4xl font-bold text-cocoa">Pilih camilan favoritmu.</h1><p className="mt-3 text-sm leading-6 text-muted">Harga dan ketersediaan akhir akan dikonfirmasi admin sebelum pembayaran.</p></div>{!firebaseReady && <div className="mt-6"><DemoBanner/></div>}<div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari camilan…" className="h-11 w-full rounded-xl border border-stroke bg-white pl-10 pr-4 text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15"/></label><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs font-semibold ${category === item ? 'bg-cocoa text-white' : 'border border-stroke bg-white text-muted hover:text-cocoa'}`}>{item}</button>)}</div></div>{error && <div className="mt-7 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}{loading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((key) => <div key={key} className="animate-pulse rounded-2xl border border-stroke bg-white p-4"><div className="aspect-[4/3] rounded-xl bg-[#EFE7DB]"/><div className="mt-4 h-4 w-2/3 rounded bg-[#EFE7DB]"/></div>)}</div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product}/>)}</div>}{!loading && !error && filtered.length === 0 && <div className="mt-12 rounded-2xl border border-dashed border-stroke p-10 text-center text-sm text-muted">{products.length === 0 ? 'Belum ada produk yang dipublikasikan.' : 'Produk tidak ditemukan. Coba kata kunci atau kategori lain.'}</div>}</section>;
}
