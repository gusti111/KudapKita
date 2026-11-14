import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShoppingBag, Menu as MenuIcon, Camera } from 'lucide-react';
import { useCart } from '@/app/providers/CartProvider';
import { BRAND } from '@/shared/constants/brand';
import { getStorefrontPublicSettings } from '@/data/repositories/catalog.repository';

export function StorefrontLayout() {
  const { itemCount } = useCart();
  const [storeInfo, setStoreInfo] = useState({ displayName: '', tagline: '', whatsappNumber: '', instagramHandle: '' });
  useEffect(() => {
    let active = true;
    getStorefrontPublicSettings().then((settings) => {
      if (!active) return;
      setStoreInfo({
        displayName: typeof settings.displayName === 'string' ? settings.displayName : '',
        tagline: typeof settings.tagline === 'string' ? settings.tagline : '',
        whatsappNumber: typeof settings.whatsappNumber === 'string' ? settings.whatsappNumber : '',
        instagramHandle: typeof settings.instagramHandle === 'string' ? settings.instagramHandle : '',
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const storeName = storeInfo.displayName || BRAND.name;
  const storeTagline = storeInfo.tagline || BRAND.tagline;
  const whatsappHref = storeInfo.whatsappNumber.replace(/\D/g, '')
    ? `https://wa.me/${storeInfo.whatsappNumber.replace(/\D/g, '')}` : '';
  return <div className="min-h-screen bg-cream text-ink">
    <header className="sticky top-0 z-30 border-b border-stroke/80 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="KudapKita beranda">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa text-xl font-bold text-white">K</span>
          <span><span className="block font-serif text-xl font-bold leading-5">{storeName}</span><span className="text-[10px] tracking-wide text-muted">{storeTagline.toUpperCase()}</span></span>
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
          <Link to="/menu" className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa text-white md:hidden" aria-label="Lihat menu"><MenuIcon size={18}/></Link>
        </div>
      </div>
    </header>
    <main><Outlet /></main>
    <footer id="tentang" className="mt-20 bg-cocoa text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div><div className="font-serif text-2xl font-bold">KudapKita</div><p className="mt-3 max-w-xs text-sm leading-6 text-white/70">{storeTagline} Pilihan camilan rumahan untuk menemani aktivitasmu.</p></div>
        <div><div className="font-semibold">Jelajahi</div><div className="mt-3 grid gap-2 text-sm text-white/70"><Link to="/menu">Katalog produk</Link><Link to="/keranjang">Keranjang</Link><Link to="/owner/login">Akses owner</Link></div></div>
        <div><div className="font-semibold">Terhubung</div><p className="mt-3 text-sm text-white/70">Hubungi kami untuk ketersediaan, jadwal, dan konfirmasi pesanan.</p>{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm text-white hover:bg-white/20">WhatsApp KudapKita</a> : <p className="mt-3 text-xs text-white/55">Nomor WhatsApp belum diatur.</p>}{storeInfo.instagramHandle && <div className="mt-3 flex items-center gap-2 text-sm text-white/70"><Camera size={16}/> {storeInfo.instagramHandle}</div>}</div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} {storeName}.</div>
    </footer>
  </div>;
}
