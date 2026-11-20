import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  Clock3,
  Heart,
  Info,
  Leaf,
  PackageCheck,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PublicProduct } from '@/domain/entities/Product';
import { getPublishedProducts } from '@/data/repositories/catalog.repository';
import { ProductCard } from '@/areas/storefront/components/ProductCard';
import { BundleBuilder } from '@/areas/storefront/components/BundleBuilder';
import { DemoBanner } from '@/areas/storefront/components/DemoBanner';
import { useAuth } from '@/app/providers/AuthProvider';
import { PRODUCT_IMAGE_REFERENCES } from '@/data/fixtures/product-image-references';
import { unitPriceGuideLabel } from '@/data/fixtures/product-price-guide';
import { formatRupiah } from '@/shared/utils/format';
import { useCart } from '@/app/providers/CartProvider';
import { Reveal } from '@/shared/components/ui/Reveal';

const categoryDescriptions: Record<string, string> = {
  Tradisional: 'Pilihan jajanan yang akrab di meja keluarga, cocok untuk menemani waktu santai dan momen berbagi.',
  Gurih: 'Camilan bercita rasa gurih untuk teman beraktivitas atau jeda di tengah hari.',
};

type ProductNote = {
  headline: string;
  description: string;
  serving: string;
  packageInfo: string;
  taste: string;
};

const productNotes: Record<string, ProductNote> = {
  'doko-doko-bugis': {
    headline: 'Kudapan tradisional berbalut daun',
    description: 'Doko-Doko Bugis dikenal sebagai kudapan berbahan ketan dengan isian manis. Detail resep, komposisi, dan bentuk batch KudapKita mengikuti produksi Bunda dan perlu dikonfirmasi kepada pengelola.',
    serving: 'Nikmati sebagai teman minum teh atau camilan saat berkumpul.',
    packageInfo: 'Format kemasan reguler yang dibahas: sekitar 4–5 pcs per kemasan.',
    taste: 'Manis tradisional',
  },
  'risol-kentang-bengkuang': {
    headline: 'Risol gurih dengan isian sayuran',
    description: 'Risol dengan kombinasi kentang dan bengkuang. Komposisi rinci, ukuran, dan informasi alergen perlu dikonfirmasi berdasarkan resep produksi aktual.',
    serving: 'Cocok untuk selingan sore atau pelengkap kudapan bersama.',
    packageInfo: 'Bisa dipesan satuan atau disusun dalam paket campur 4/5/10 pcs.',
    taste: 'Gurih',
  },
  'risol-mayo': {
    headline: 'Risol gurih dengan isian mayones',
    description: 'Camilan gurih dengan isian mayones. Bahan campuran lain, komposisi, serta informasi alergen belum diasumsikan dan perlu dikonfirmasi kepada pengelola.',
    serving: 'Pilihan praktis untuk teman istirahat atau bekal aktivitas.',
    packageInfo: 'Bisa dipesan satuan atau disusun dalam paket campur 4/5/10 pcs.',
    taste: 'Gurih dan creamy',
  },
  'onde-onde': {
    headline: 'Kudapan klasik bertabur wijen',
    description: 'Onde-onde dikenal dengan lapisan wijen pada bagian luar. Jenis isian, ukuran, dan komposisi produk KudapKita dikonfirmasi oleh pengelola.',
    serving: 'Nikmati sebagai camilan ringan atau sajian untuk dibagikan.',
    packageInfo: 'Format kemasan reguler yang dibahas: sekitar 4–5 pcs per kemasan.',
    taste: 'Tradisional',
  },
  'dadar-gulung': {
    headline: 'Dadar pandan dengan isian kelapa',
    description: 'Dadar gulung dikenal dengan kulit berwarna hijau dan isian kelapa. Detail resep, tingkat kemanisan, dan komposisi aktual mengikuti produksi KudapKita.',
    serving: 'Pas untuk teman minum teh atau kopi di waktu santai.',
    packageInfo: 'Format kemasan reguler yang dibahas: sekitar 4–5 pcs per kemasan.',
    taste: 'Manis tradisional',
  },
  apam: {
    headline: 'Kue tradisional bertekstur lembut',
    description: 'Apam merupakan salah satu pilihan kue tradisional dengan tekstur lembut. Varian, komposisi, ukuran, dan topping mengikuti batch yang dibuat Bunda.',
    serving: 'Nikmati sebagai kudapan ringan di rumah maupun saat berkumpul.',
    packageInfo: 'Jumlah per kemasan mengikuti ukuran dan hasil produksi aktual.',
    taste: 'Kue tradisional',
  },
};

export function CatalogPage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sort, setSort] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const dialogRef = useRef<HTMLElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { firebaseReady } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    let active = true;
    getPublishedProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setError('Katalog belum dapat dimuat. Silakan coba muat ulang halaman.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['Semua', ...new Set(products.map((item) => item.categoryName))], [products]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('id-ID');
    const result = products.filter((item) =>
      (category === 'Semua' || item.categoryName === category) &&
      `${item.name} ${item.shortDescription} ${item.categoryName}`.toLocaleLowerCase('id-ID').includes(keyword),
    );
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    if (sort === 'price-low') result.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
    if (sort === 'price-high') result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === 'recommended') result.sort((a, b) => a.sortOrder - b.sortOrder);
    return result;
  }, [products, search, category, sort]);

  const selectedProduct = products.find((item) => item.slug === searchParams.get('item'));
  const selectedImage = selectedProduct ? PRODUCT_IMAGE_REFERENCES[selectedProduct.slug] : undefined;
  const selectedImageSrc = selectedProduct?.imagePath || selectedImage?.src;
  const selectedNote = selectedProduct ? productNotes[selectedProduct.slug] : undefined;
  const selectedUsesIllustration = Boolean(selectedProduct && selectedImage && (!selectedProduct.imagePath || selectedProduct.imagePath === selectedImage.src));

  useEffect(() => {
    if (!selectedProduct) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogCloseRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchParams({}, { replace: true });
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogCloseRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKeyDown);
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [selectedProduct, setSearchParams]);

  const clearFilters = () => {
    setSearch('');
    setCategory('Semua');
    setSort('recommended');
  };

  return <>
    <section className="menu-hero relative isolate overflow-hidden bg-[#EDE4D8]">
      <div className="menu-hero-orb menu-hero-orb-one" aria-hidden="true" />
      <div className="menu-hero-orb menu-hero-orb-two" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <span className="eyebrow"><Sparkles size={13}/> Menu KudapKita</span>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-cocoa sm:text-5xl lg:text-6xl">Camilan kecil,<br/><span className="text-terracotta">senang yang besar.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted sm:text-base sm:leading-8">Temukan pilihan manis dan gurih untuk menemani waktu santai, dibawa sebagai bekal, atau dinikmati bersama orang terdekat. Pilihan menu mengikuti jadwal produksi.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#daftar-menu" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cocoa px-5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-terracotta">Jelajahi menu <ArrowRight size={16}/></a>
            <Link to="/#cara-pesan" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cocoa/15 bg-white/55 px-5 text-sm font-bold text-cocoa transition hover:bg-white"><Info size={16}/> Cara memesan</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-semibold text-cocoa/70">
            <span className="inline-flex items-center gap-2"><Leaf size={15} className="text-sage"/> Pilihan manis & gurih</span>
            <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-terracotta"/> Ready stock / pre-order</span>
            <span className="inline-flex items-center gap-2"><Heart size={15} className="text-terracotta"/> Cocok untuk berbagi</span>
          </div>
        </div>
        <div className="menu-hero-visual relative mx-auto w-full max-w-[510px]">
          <div className="menu-hero-image relative aspect-[1.12/1] overflow-hidden rounded-[2rem] border-[7px] border-white/65 bg-[#D9C4A9] shadow-card">
            <img src={PRODUCT_IMAGE_REFERENCES['dadar-gulung'].src} alt={PRODUCT_IMAGE_REFERENCES['dadar-gulung'].alt} className="h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/65 via-transparent to-transparent"/>
            <div className="absolute bottom-5 left-5 right-5 text-white"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/75">Koleksi camilan rumahan</span><p className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Ada yang manis, ada yang gurih.</p></div>
          </div>
          <div className="menu-hero-note absolute -bottom-5 -left-2 rounded-2xl border border-white/70 bg-[#FFFDF9] px-4 py-3 shadow-card sm:-left-7"><span className="block text-[9px] font-bold uppercase tracking-[.16em] text-terracotta">Pilihan menu</span><span className="mt-1 block font-serif text-lg font-bold text-cocoa">Dibuat untuk dinikmati</span></div>
          <div className="absolute -right-2 -top-4 grid h-16 w-16 place-items-center rounded-full border border-white/80 bg-sage text-center text-[9px] font-black uppercase leading-4 tracking-wider text-white shadow-lg sm:-right-4 sm:h-20 sm:w-20">Rasa<br/>rumahan</div>
        </div>
      </div>
    </section>

    <BundleBuilder products={products}/>

    <section id="daftar-menu" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {!firebaseReady && <div className="mb-7"><DemoBanner/></div>}
      <Reveal>
        <div className="mb-7 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div><span className="eyebrow">Pilih sesuai selera</span><h2 className="section-title">Temukan menu favoritmu.</h2><p className="section-copy">Jelajahi enam menu utama KudapKita. Paket campur 4, 5, dan 10 pcs tersedia sebagai pilihan pemesanan.</p></div>
          <div className="flex items-center gap-2 rounded-2xl border border-stroke bg-white px-4 py-3 shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F0E7DB] text-terracotta"><PackageCheck size={19}/></span><span><strong className="block text-xs text-cocoa">Menu mengikuti produksi</strong><span className="mt-1 block text-[10px] text-muted">Ready stock atau pre-order</span></span></div>
        </div>
      </Reveal>

      <div className="catalog-toolbar rounded-[1.5rem] border border-stroke bg-white p-4 shadow-soft sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari risol, onde-onde, dadar gulung…" className="min-h-12 w-full rounded-xl border border-stroke bg-[#FBF9F5] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#A89A8E] focus:border-terracotta focus:ring-4 focus:ring-terracotta/10" aria-label="Cari produk"/>
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-[#F0E7DB]"><X size={15}/></button>}
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stroke bg-[#FBF9F5] px-4 text-xs font-bold text-muted lg:min-w-[220px]">
            <ArrowUpDown size={15}/><span className="shrink-0">Urutkan</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-bold text-cocoa outline-none">
              <option value="recommended">Rekomendasi</option><option value="name">Nama A–Z</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter kategori">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-muted"><SlidersHorizontal size={13}/> Kategori</span>
          {categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 rounded-full px-4 text-xs font-bold transition ${category === item ? 'bg-cocoa text-white shadow-sm' : 'border border-stroke bg-white text-muted hover:border-terracotta/40 hover:text-cocoa'}`}>{item}</button>)}
          {(search || category !== 'Semua' || sort !== 'recommended') && <button type="button" onClick={clearFilters} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-terracotta hover:bg-[#FBF0E7]"><X size={13}/> Reset filter</button>}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-serif text-2xl font-bold text-cocoa">{category === 'Semua' ? 'Semua pilihan' : category}</h2><p className="mt-1 text-xs text-muted">{loading ? 'Memuat katalog…' : `${filtered.length} produk ditampilkan`}</p></div>
        <span className="rounded-full bg-[#F0E7DB] px-3 py-1.5 text-[10px] font-semibold text-cocoa">Panduan {unitPriceGuideLabel()} / pcs · final dikonfirmasi owner</span>
      </div>
      {category !== 'Semua' && categoryDescriptions[category] && <p className="mt-2 max-w-2xl text-xs leading-6 text-muted">{categoryDescriptions[category]}</p>}
      {error && <div role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0,1,2,3,4,5].map((key) => <div key={key} className="animate-pulse rounded-[1.35rem] border border-stroke bg-white p-3"><div className="aspect-[4/3] rounded-xl bg-[#EFE7DB]"/><div className="mt-4 h-4 w-2/3 rounded bg-[#EFE7DB]"/><div className="mt-3 h-3 w-full rounded bg-[#EFE7DB]"/></div>)}</div>
        : filtered.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product, index) => <Reveal key={product.id} delayMs={Math.min(index * 55, 220)}><ProductCard product={product}/></Reveal>)}</div>
        : <div className="mt-8 rounded-[1.6rem] border border-dashed border-stroke bg-white px-6 py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F0E7DB] text-cocoa"><Search size={22}/></div><h3 className="mt-4 font-serif text-xl font-bold text-cocoa">{products.length ? 'Belum ada produk yang cocok' : 'Menu belum dimuat ke katalog'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{products.length ? 'Coba kata kunci lain atau ubah kategori pilihanmu.' : 'Masuk sebagai owner, buka Dashboard → Produk, lalu pilih “Muat 6 menu dasar”. Data akan ditambahkan ke Firestore tanpa menimpa produk yang sudah ada.'}</p><button type="button" onClick={clearFilters} className="mt-5 min-h-11 rounded-full bg-cocoa px-5 text-xs font-bold text-white transition hover:bg-terracotta">Tampilkan semua produk</button></div>}

      <Reveal>
        <div className="mt-10 grid gap-3 rounded-[1.5rem] border border-stroke bg-[#F4EDE3] p-5 sm:grid-cols-3 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-terracotta"><Clock3 size={18}/></span><div><h3 className="text-xs font-extrabold text-cocoa">Cek jadwal produksi</h3><p className="mt-1 text-[11px] leading-5 text-muted">Tidak semua menu tersedia setiap hari. Tanyakan jadwal terbaru sebelum memesan.</p></div></div>
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-terracotta"><ShoppingBag size={18}/></span><div><h3 className="text-xs font-extrabold text-cocoa">Ready stock atau pre-order</h3><p className="mt-1 text-[11px] leading-5 text-muted">Status katalog mengikuti pembaruan owner dan hasil produksi aktual.</p></div></div>
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-terracotta"><Info size={18}/></span><div><h3 className="text-xs font-extrabold text-cocoa">Detail yang transparan</h3><p className="mt-1 text-[11px] leading-5 text-muted">Tanyakan harga final, komposisi, alergen, ukuran, serta masa simpan bila diperlukan.</p></div></div>
        </div>
      </Reveal>
      <p className="mt-6 max-w-3xl text-[10px] leading-5 text-muted">Seluruh gambar bawaan katalog adalah ilustrasi AI untuk membantu mengenali menu, bukan foto aktual produksi KudapKita. Rentang Rp1.500–Rp2.000 per pcs dan promo 10 pcs Rp12.000–Rp13.000 merupakan panduan awal hasil pembahasan; harga setiap produk dan promo final tetap disahkan owner. Komposisi, alergen, ukuran, serta masa simpan hanya boleh dipastikan oleh pengelola.</p>
    </section>

    {selectedProduct && <div className="product-dialog-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#21150F]/70 p-3 backdrop-blur-sm sm:p-5" role="presentation" onClick={() => setSearchParams({}, { replace: true })}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" aria-describedby="product-dialog-description" className="product-dialog relative my-auto grid w-full max-w-4xl overflow-hidden rounded-[1.7rem] bg-[#FFFDF9] shadow-2xl md:grid-cols-[.95fr_1.05fr]" onClick={(event) => event.stopPropagation()}>
        <button ref={dialogCloseRef} type="button" onClick={() => setSearchParams({}, { replace: true })} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-cocoa shadow" aria-label="Tutup detail produk"><X size={18}/></button>
        <div className="relative min-h-[230px] bg-[#E9D9C5] sm:min-h-[330px] md:min-h-[520px]">{selectedImageSrc && <img src={selectedImageSrc} alt={selectedImage?.alt || selectedProduct.name} className="absolute inset-0 h-full w-full object-cover"/>}<div className="absolute inset-0 bg-gradient-to-t from-cocoa/35 to-transparent"/><span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-cocoa">{selectedProduct.categoryName}</span>{selectedUsesIllustration && <span className="absolute bottom-4 right-4 rounded-full bg-cocoa/75 px-3 py-1.5 text-[9px] font-semibold text-white">Ilustrasi AI</span>}</div>
        <div className="flex max-h-[82vh] flex-col overflow-y-auto p-5 sm:p-7 md:p-9">
          <span className="eyebrow">Kenali pilihanmu</span>
          <h2 id="product-dialog-title" className="mt-3 font-serif text-3xl font-bold leading-tight text-cocoa">{selectedProduct.name}</h2>
          <p id="product-dialog-description" className="mt-3 text-sm leading-7 text-muted">{selectedNote?.description || selectedProduct.shortDescription}</p>
          <div className="mt-5 rounded-2xl bg-[#F1E9DE] p-4"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">{selectedProduct.price == null ? 'Panduan harga per pcs' : 'Harga satuan'}</span><span className="mt-1 block text-xl font-extrabold text-cocoa">{selectedProduct.price == null ? unitPriceGuideLabel() : formatRupiah(selectedProduct.price)}</span><span className="mt-1 block text-[10px] leading-5 text-muted">{selectedProduct.price == null ? 'Rentang awal usaha, bukan harga final khusus produk ini. Owner mengonfirmasi harga sebelum pembayaran.' : 'Harga yang dipublikasikan owner; total akhir tetap dikonfirmasi sebelum pembayaran.'}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-stroke p-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted"><Sparkles size={13}/> Karakter menu</span><p className="mt-2 text-xs font-semibold leading-5 text-cocoa">{selectedNote?.headline || selectedProduct.shortDescription}</p><p className="mt-1 text-[10px] text-muted">Profil rasa: {selectedNote?.taste || selectedProduct.categoryName}</p></div>
            <div className="rounded-xl border border-stroke p-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted"><Heart size={13}/> Saran menikmati</span><p className="mt-2 text-xs leading-5 text-cocoa">{selectedNote?.serving || 'Tanyakan pilihan penyajian kepada pengelola.'}</p></div>
            <div className="rounded-xl border border-stroke p-3 sm:col-span-2"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted"><PackageCheck size={13}/> Pilihan kemasan</span><p className="mt-2 text-xs leading-5 text-cocoa">{selectedNote?.packageInfo || 'Kemasan dan jumlah isi dikonfirmasi oleh pengelola.'}</p></div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F6F1EA] p-3 text-[10px] leading-5 text-muted"><Info size={14} className="mt-0.5 shrink-0 text-terracotta"/><span>Komposisi rinci, informasi alergen, berat, dan masa simpan belum ditetapkan di katalog publik. Mohon konfirmasi kepada pengelola sebelum memesan.</span></div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" disabled={selectedProduct.availability === 'SOLD_OUT'} onClick={() => { addItem(selectedProduct); setSearchParams({}, { replace: true }); }} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-cocoa px-5 text-sm font-bold text-white transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-stone-300"><Check size={16}/> Tambahkan ke keranjang</button>
            <button type="button" onClick={() => setSearchParams({}, { replace: true })} className="inline-flex min-h-12 items-center justify-center rounded-full border border-stroke px-5 text-sm font-bold text-cocoa transition hover:bg-[#F6F1EA]">Tutup</button>
          </div>
        </div>
      </section>
    </div>}
  </>;
}
