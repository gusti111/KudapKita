import { useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Clock3, PackageCheck, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicProduct } from '@/domain/entities/Product';
import { getPublishedProducts } from '@/data/repositories/catalog.repository';
import { ProductCard } from '@/areas/storefront/components/ProductCard';
import { DemoBanner } from '@/areas/storefront/components/DemoBanner';
import { useAuth } from '@/app/providers/AuthProvider';

const HERO_SLIDES = [
  {
    eyebrow: 'Dari dapur, untuk hari-harimu',
    title: <>Jajan enak, <em>dekat</em>, dan praktis.</>,
    copy: 'Temukan camilan rumahan untuk menemani jeda, obrolan, dan momen sederhana.',
    image: '/images/hero-assortment.webp',
    position: 'center 50%',
    action: 'Jelajahi menu',
  },
  {
    eyebrow: 'Teman untuk setiap suasana',
    title: <>Ada kudapan untuk <em>setiap cerita.</em></>,
    copy: 'Pilih menu yang tersedia atau titipkan pesanan sesuai jadwal produksi.',
    image: '/images/hero-sweet.webp',
    position: 'center 48%',
    action: 'Temukan favorit',
  },
  {
    eyebrow: 'Mudah dari awal sampai akhir',
    title: <>Pilih camilan. Kami bantu <em>urus sisanya.</em></>,
    copy: 'Kirim permintaan pesanan, lalu admin mengonfirmasi stok, total akhir, dan waktu pengambilan.',
    image: '/images/hero-savory.webp',
    position: 'center 54%',
    action: 'Mulai memesan',
  },
];

export function HomePage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { firebaseReady } = useAuth();
  const productRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getPublishedProducts()
      .then((result) => { if (active) setProducts(result); })
      .catch(() => { if (active) setError('Menu sedang sulit dimuat. Silakan buka katalog untuk mencoba kembali.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.categoryName) counts.set(product.categoryName, (counts.get(product.categoryName) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [products]);
  const featuredProducts = products.slice(0, 8);

  function scrollProducts(direction: -1 | 1) {
    productRail.current?.scrollBy({ left: direction * Math.max(280, productRail.current.clientWidth * 0.78), behavior: 'smooth' });
  }

  return <>
    <HeroCarousel />

    <section className="storefront-trust-strip mx-auto -mt-1 grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
      <TrustItem icon={<BadgeCheck size={19}/>} title="Menu terkurasi" copy="Dari dapur rumahan" />
      <TrustItem icon={<ShieldCheck size={19}/>} title="Konfirmasi jelas" copy="Harga oleh admin" />
      <TrustItem icon={<Clock3 size={19}/>} title="Jadwal fleksibel" copy="Sesuai ketersediaan" />
      <TrustItem icon={<PackageCheck size={19}/>} title="Ambil atau antar" copy="Atur saat checkout" />
    </section>

    {!firebaseReady && <section className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8"><DemoBanner /></section>}

    {categories.length > 0 && <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <SectionHeading kicker="Jelajahi pilihan" title="Mulai dari yang kamu suka." copy="Temukan pilihan berdasarkan kategori yang tersedia di katalog." action={<Link to="/menu" className="section-link">Semua menu <ArrowUpRight size={15}/></Link>} />
      <div className="category-explorer mt-7">
        {categories.map(([name, count], index) => <Link key={name} to={`/menu?category=${encodeURIComponent(name)}`} className={`category-tile category-tile--${index % 4}`}>
          <span className="category-tile__index">0{index + 1}</span><span className="category-tile__name">{name}</span><span className="category-tile__count">{count} produk aktif</span><ArrowUpRight size={17} className="category-tile__arrow" />
        </Link>)}
      </div>
    </section>}

    <section className="featured-section py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading kicker="Pilihan KudapKita" title="Camilan yang siap menemani." copy="Produk yang ditampilkan mengikuti katalog aktif—tanpa stok atau harga rekaan." />
          <div className="featured-controls hidden sm:flex">
            <button type="button" onClick={() => scrollProducts(-1)} aria-label="Geser produk ke kiri"><ArrowLeft size={17}/></button>
            <button type="button" onClick={() => scrollProducts(1)} aria-label="Geser produk ke kanan"><ArrowRight size={17}/></button>
          </div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {loading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-stroke bg-white"><div className="skeleton-block aspect-[4/3]"/><div className="space-y-3 p-4"><div className="skeleton-block h-4 w-2/3"/><div className="skeleton-block h-3 w-full"/><div className="skeleton-block h-9 w-1/2"/></div></div>)}</div> : featuredProducts.length > 0 ? (
          <div ref={productRail} className="featured-product-rail mt-7" aria-label="Pilihan produk">
            {featuredProducts.map((product) => <div key={product.id} className="featured-product-rail__item"><ProductCard product={product}/></div>)}
          </div>
        ) : <div className="mt-7 rounded-2xl border border-dashed border-stroke bg-white p-10 text-center"><div className="text-3xl">🥮</div><h3 className="mt-3 font-serif text-xl font-bold text-cocoa">Katalog sedang disiapkan.</h3><p className="mt-1 text-sm text-muted">Menu akan tampil di sini setelah produk diterbitkan oleh owner.</p></div>}
        <div className="mt-7 flex justify-center"><Link to="/menu" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-cocoa/15 bg-white px-5 text-sm font-bold text-cocoa transition hover:border-terracotta hover:text-terracotta">Lihat seluruh katalog <ArrowRight size={16}/></Link></div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <SectionHeading kicker="Cara memesan" title="Praktis, tanpa menebak-nebak." copy="Alur sederhana yang membuat harga, stok, dan jadwal tetap dikonfirmasi dengan jelas." />
      <div className="order-steps mt-8">
        <OrderStep number="01" title="Pilih camilan" copy="Jelajahi menu, baca deskripsi, lalu masukkan pilihan ke keranjang." />
        <OrderStep number="02" title="Kirim permintaan" copy="Isi kontak dan metode penerimaan. Permintaan belum menjadi tagihan." />
        <OrderStep number="03" title="Konfirmasi admin" copy="Admin memeriksa ketersediaan, total akhir, dan waktu pengambilan atau pengantaran." />
      </div>
    </section>

    <section className="home-cta-wrap px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
      <div className="home-cta-panel mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-cocoa text-white">
        <div className="home-cta-panel__copy">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#E8BD8A]"><Sparkles size={14}/> KudapKita</span>
          <h2 className="mt-3 max-w-xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Ada rasa rumahan di setiap gigitan.</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/75">Pilih menu yang tersedia dan sampaikan kebutuhanmu. Kami bantu konfirmasi pesanan dengan lebih rapi.</p>
          <Link to="/menu" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#E7B477] px-5 text-sm font-extrabold text-cocoa transition hover:bg-[#F1C996]">Cari camilan sekarang <ShoppingBag size={16}/></Link>
        </div>
        <div className="home-cta-panel__note"><span>01 / 03</span><strong>Jajan enak,<br/>dekat, dan praktis.</strong><span>Teman kecil untuk hari yang lebih hangat.</span></div>
      </div>
    </section>
  </>;
}

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const slide = HERO_SLIDES[active];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % HERO_SLIDES.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  function move(direction: -1 | 1) { setActive((current) => (current + direction + HERO_SLIDES.length) % HERO_SLIDES.length); }
  function finishTouch(event: TouchEvent<HTMLElement>) {
    if (touchStart.current === null) return;
    const difference = touchStart.current - event.changedTouches[0].clientX;
    if (Math.abs(difference) > 45) move(difference > 0 ? 1 : -1);
    touchStart.current = null;
  }

  return <section className="campaign-carousel-v2" aria-roledescription="carousel" aria-label="Sorotan KudapKita" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={finishTouch}>
    <div className="campaign-v2-background" aria-hidden="true"><img key={slide.image} src={slide.image} alt="" fetchPriority={active === 0 ? 'high' : 'auto'} style={{ objectPosition: slide.position }}/><div className="campaign-v2-overlay"/></div>
    <div className="campaign-v2-inner mx-auto flex max-w-7xl items-end px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="campaign-v2-copy max-w-2xl" key={active}>
        <span className="campaign-v2-eyebrow"><span className="campaign-v2-eyebrow__dot"/>{slide.eyebrow}</span>
        <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">{slide.title}</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base">{slide.copy}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/menu" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#E7B477] px-5 text-sm font-extrabold text-cocoa shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#F0C58E]">{slide.action}<ArrowRight size={16}/></Link>
          <Link to="/keranjang" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">Lihat keranjang</Link>
        </div>
        <div className="campaign-v2-steps mt-9 flex flex-wrap gap-2 text-[11px] font-semibold text-white/75"><span>01 · Pilih</span><span>02 · Pesan</span><span>03 · Konfirmasi</span></div><p className="campaign-v2-disclaimer mt-3 text-[10px] text-white/55">Foto inspirasi jajanan rumahan · menu aktual mengikuti katalog toko.</p>
      </div>
      <div className="campaign-v2-controls absolute bottom-5 right-4 flex items-center gap-2 sm:bottom-7 sm:right-[max(1.5rem,calc((100vw-80rem)/2+2rem))]">
        <button type="button" className="campaign-v2-arrow" onClick={() => move(-1)} aria-label="Slide sebelumnya"><ArrowLeft size={17}/></button>
        <div className="flex items-center gap-1.5 px-1" aria-label={`Slide ${active + 1} dari ${HERO_SLIDES.length}`}>
          {HERO_SLIDES.map((item, index) => <button key={item.eyebrow} type="button" className={`campaign-v2-dot ${index === active ? 'is-active' : ''}`} onClick={() => setActive(index)} aria-label={`Tampilkan slide ${index + 1}`} aria-current={index === active ? 'true' : undefined}/>) }
        </div>
        <button type="button" className="campaign-v2-arrow" onClick={() => move(1)} aria-label="Slide berikutnya"><ArrowRight size={17}/></button>
      </div>
    </div>
  </section>;
}

function SectionHeading({ kicker, title, copy, action }: { kicker: string; title: string; copy: string; action?: ReactNode }) {
  return <div className="section-heading-row"><div><span className="eyebrow">{kicker}</span><h2 className="section-title mt-2 font-serif text-3xl font-bold text-cocoa sm:text-4xl">{title}</h2><p className="section-copy mt-2 text-sm leading-6 text-muted">{copy}</p></div>{action}</div>;
}
function TrustItem({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="trust-item"><span className="trust-item__icon">{icon}</span><span><strong>{title}</strong><small>{copy}</small></span></div>;
}
function OrderStep({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <article className="order-step"><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>;
}
