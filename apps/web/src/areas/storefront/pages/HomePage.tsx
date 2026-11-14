import { ArrowRight, Clock3, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { PublicProduct } from '@/domain/entities/Product';
import { getPublishedProducts } from '@/data/repositories/catalog.repository';
import { ProductCard } from '@/areas/storefront/components/ProductCard';
import { DemoBanner } from '@/areas/storefront/components/DemoBanner';
import { useAuth } from '@/app/providers/AuthProvider';

export function HomePage() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [error, setError] = useState('');
  const { firebaseReady } = useAuth();
  useEffect(() => { getPublishedProducts().then(setProducts).catch(() => setError('Katalog belum dapat dimuat. Silakan coba lagi.')); }, []);
  return <>
    <section className="relative overflow-hidden bg-cocoa text-white">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-terracotta/30 blur-3xl"/><div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-sage/30 blur-3xl"/>
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_.95fr] md:py-24 lg:px-8">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80"><Sparkles size={14}/> Camilan tradisional & modern</span><h1 className="mt-6 max-w-xl font-serif text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">Temukan camilan yang bikin <span className="text-[#E7B477]">hari lebih hangat.</span></h1><p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base">Pilih camilan favorit, cek ketersediaan, lalu kirim permintaan pesanan dengan praktis.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/menu" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#E5B277] px-5 text-sm font-bold text-cocoa hover:bg-[#f0c58f]">Jelajahi menu <ArrowRight size={17}/></Link><Link to="/keranjang" className="inline-flex h-12 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10">Lihat keranjang</Link></div><div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/70"><span className="flex items-center gap-2"><ShieldCheck size={15}/> Konfirmasi admin</span><span className="flex items-center gap-2"><Clock3 size={15}/> Jadwal disepakati</span><span className="flex items-center gap-2"><PackageCheck size={15}/> Ambil atau antar</span></div></div>
        <div className="relative mx-auto w-full max-w-lg"><div className="absolute inset-5 rotate-3 rounded-[2rem] bg-[#D8893B]/25"/><div className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#F1D9B8] via-[#C98B58] to-[#81533F] p-8 text-center shadow-2xl"><div className="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold tracking-widest text-cocoa">KUDAPKITA</div><div><div className="text-7xl sm:text-8xl">🥥 🍡</div><div className="mt-5 font-serif text-2xl font-bold text-[#3E291F]">Rasa rumahan,<br/>teman keseharian.</div><div className="mt-2 text-xs text-[#3E291F]/70">Ilustrasi visual — foto produk aktual menyusul</div></div></div><div className="absolute -bottom-5 -left-4 rounded-2xl bg-white px-4 py-3 text-cocoa shadow-card"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Belanja lebih praktis</div><div className="mt-1 text-sm font-bold">Pilih · Pesan · Konfirmasi</div></div></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{!firebaseReady && <DemoBanner/>}</section>
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">Pilihan KudapKita</span><h2 className="mt-2 font-serif text-3xl font-bold text-cocoa">Favorit untuk dicoba</h2><p className="mt-2 text-sm text-muted">Lihat pilihan camilan yang tersedia.</p></div><Link to="/menu" className="hidden items-center gap-2 text-sm font-semibold text-terracotta sm:inline-flex">Lihat semua <ArrowRight size={16}/></Link></div>
      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,4).map((product) => <ProductCard key={product.id} product={product}/>)}</div>}
      <div className="mt-6 text-center sm:hidden"><Link to="/menu" className="text-sm font-semibold text-terracotta">Lihat semua menu →</Link></div>
    </section>
    <section className="bg-[#EFE7DB] py-14"><div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8"><div><div className="text-2xl">🧺</div><h3 className="mt-3 font-semibold text-cocoa">Pilih sesuai selera</h3><p className="mt-1 text-sm leading-6 text-muted">Jelajahi produk satuan maupun paket camilan.</p></div><div><div className="text-2xl">💬</div><h3 className="mt-3 font-semibold text-cocoa">Konfirmasi lebih jelas</h3><p className="mt-1 text-sm leading-6 text-muted">Admin memeriksa stok, jadwal, dan total akhir sebelum pembayaran.</p></div><div><div className="text-2xl">📦</div><h3 className="mt-3 font-semibold text-cocoa">Ambil atau terima</h3><p className="mt-1 text-sm leading-6 text-muted">Pilih pengambilan atau pengantaran sesuai layanan yang tersedia.</p></div></div></section>
  </>;
}
