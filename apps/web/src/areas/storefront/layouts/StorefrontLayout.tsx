import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShoppingBag, Menu as MenuIcon, Camera, X } from 'lucide-react';
import { useCart } from '@/app/providers/CartProvider';
import { BRAND } from '@/shared/constants/brand';

export function StorefrontLayout() {
  const { itemCount } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  return <div className="min-h-screen bg-cream text-ink">
    <header className="sticky top-0 z-30 border-b border-stroke/80 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="KudapKita beranda">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa text-xl font-bold text-white">K</span>
          <span><span className="block font-serif text-xl font-bold leading-5">{BRAND.name}</span><span className="text-[10px] tracking-wide text-muted">JAJAN ENAK, DEKAT, PRAKTIS</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Navigasi utama">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-terracotta' : 'text-muted hover:text-cocoa'}>Beranda</NavLink>
          <NavLink to="/menu" className={({ isActive }) => isActive ? 'text-terracotta' : 'text-muted hover:text-cocoa'}>Katalog</NavLink>
          <a href="#tentang" className="text-muted hover:text-cocoa">Tentang</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/keranjang" className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-stroke bg-white px-3 text-sm font-semibold text-cocoa hover:bg-white/70" aria-label={`Keranjang, ${itemCount} item`}>
            <ShoppingBag size={17}/><span className="hidden sm:inline">Keranjang</span>
            {itemCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[10px] text-white">{itemCount}</span>}
          </Link>
          <Link to="/owner/login" className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:bg-white sm:inline-flex">Owner</Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa text-white md:hidden" aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-expanded={menuOpen} aria-controls="storefront-mobile-menu">{menuOpen ? <X size={18}/> : <MenuIcon size={18}/>}</button>
        </div>
      </div>
      <nav id="storefront-mobile-menu" hidden={!menuOpen} className="storefront-mobile-menu mx-3 mb-3 flex-col gap-1 rounded-2xl border border-stroke bg-white p-3 shadow-card md:hidden" aria-label="Navigasi seluler">
        <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-[#F3E8DB] text-cocoa' : 'text-muted hover:bg-cream'}`}>Beranda</NavLink>
        <NavLink to="/menu" onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-[#F3E8DB] text-cocoa' : 'text-muted hover:bg-cream'}`}>Katalog produk</NavLink>
        <a href="#tentang" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-cream">Tentang KudapKita</a>
        <Link to="/owner/login" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-cream">Akses owner</Link>
      </nav>
    </header>
    <main><Outlet /></main>
    <footer id="tentang" className="mt-20 bg-cocoa text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div><div className="font-serif text-2xl font-bold">KudapKita</div><p className="mt-3 max-w-xs text-sm leading-6 text-white/70">{BRAND.tagline} Pilihan camilan tradisional dan modern untuk menemani aktivitasmu.</p></div>
        <div><div className="font-semibold">Jelajahi</div><div className="mt-3 grid gap-2 text-sm text-white/70"><Link to="/menu">Katalog produk</Link><Link to="/keranjang">Keranjang</Link><Link to="/owner/login">Akses owner</Link></div></div>
        <div><div className="font-semibold">Terhubung</div><p className="mt-3 text-sm text-white/70">Hubungi kami melalui WhatsApp untuk ketersediaan, jadwal, dan konfirmasi pesanan.</p><div className="mt-3 flex items-center gap-2 text-sm text-white/70"><Camera size={16}/> Instagram <span className="text-xs">(tautan akan ditambahkan)</span></div></div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} KudapKita. Informasi kontak dan identitas brand perlu difinalisasi.</div>
    </footer>
  </div>;
}
