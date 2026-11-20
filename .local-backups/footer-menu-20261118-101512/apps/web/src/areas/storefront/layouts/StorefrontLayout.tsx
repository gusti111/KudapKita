
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  Camera,
  Menu as MenuIcon,
  MessageCircle,
  ShoppingBag,
  X,
} from 'lucide-react';

import { useCart } from '@/app/providers/CartProvider';
import { BRAND } from '@/shared/constants/brand';
import { getStorefrontPublicSettings } from '@/data/repositories/catalog.repository';
import { BrandLockup } from '@/shared/components/ui/BrandLockup';

export function StorefrontLayout() {
  const { itemCount } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  const [storeInfo, setStoreInfo] = useState({
    displayName: '',
    tagline: '',
    whatsappNumber: '',
    instagramHandle: '',
  });

  useEffect(() => {
    let active = true;

    getStorefrontPublicSettings()
      .then((settings) => {
        if (!active) return;

        setStoreInfo({
          displayName:
            typeof settings.displayName === 'string'
              ? settings.displayName
              : '',
          tagline:
            typeof settings.tagline === 'string'
              ? settings.tagline
              : '',
          whatsappNumber:
            typeof settings.whatsappNumber === 'string'
              ? settings.whatsappNumber
              : '',
          instagramHandle:
            typeof settings.instagramHandle === 'string'
              ? settings.instagramHandle
              : '',
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const storeName = storeInfo.displayName || BRAND.name;
  const storeTagline = storeInfo.tagline || BRAND.tagline;

  const normalizedWhatsapp = storeInfo.whatsappNumber.replace(/\D/g, '');
  const whatsappHref = normalizedWhatsapp
    ? `https://wa.me/${normalizedWhatsapp}`
    : '';

  const instagramHandle = storeInfo.instagramHandle.replace(/^@/, '');
  const instagramHref = instagramHandle
    ? `https://instagram.com/${instagramHandle}`
    : '';

  function closeMenu() {
    setMenuOpen(false);
    if (menuOpen) window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>('a[href]');
    firstLink?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(targetId)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return (
    <div className="storefront-layout">
      {/* Announcement bar */}
      <div className="hidden bg-cocoa py-2 text-center text-xs font-medium text-white/80 sm:block">
        Camilan rumahan, dibuat dengan rasa dan cerita.
      </div>

      {/* Header */}
      <header className="storefront-header">
        <div className="storefront-header__inner">
          <Link
            to="/"
            onClick={closeMenu}
            aria-label={`${storeName} beranda`}
          >
            <BrandLockup
              name={storeName}
              tagline={storeTagline.toUpperCase()}
              showTagline
            />
          </Link>

          <nav
            className="storefront-nav"
            aria-label="Navigasi utama"
          >
            <ul className="storefront-nav__list">
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `storefront-nav__link ${
                      isActive ? 'storefront-nav__link-active' : ''
                    }`
                  }
                >
                  Beranda
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/menu"
                  className={({ isActive }) =>
                    `storefront-nav__link ${
                      isActive ? 'storefront-nav__link-active' : ''
                    }`
                  }
                >
                  Menu camilan
                </NavLink>
              </li>

              <li>
                <Link to="/#cerita-kami" className="storefront-nav__link">
                  Cerita kami
                </Link>
              </li>

              <li>
                <Link to="/#cara-pesan" className="storefront-nav__link">
                  Cara pesan
                </Link>
              </li>
            </ul>
          </nav>

          <div className="storefront-header__actions">
            <Link
              to="/keranjang"
              className="header-cart"
              aria-label={`Keranjang, ${itemCount} item`}
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Keranjang</span>

              {itemCount > 0 && (
                <span className="header-cart__count">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              to="/menu"
              className="hidden h-11 items-center gap-2 rounded-full bg-terracotta px-5 text-xs font-bold text-white shadow-sm transition hover:bg-cocoa sm:inline-flex"
            >
              Lihat menu
              <ArrowUpRight size={15} />
            </Link>

            <button
              ref={menuToggleRef}
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full border border-stroke bg-white text-cocoa lg:hidden"
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              aria-controls="storefront-mobile-menu"
            >
              {menuOpen ? <X size={19} /> : <MenuIcon size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav
            id="storefront-mobile-menu"
            ref={mobileMenuRef}
            hidden={!menuOpen}
            className="storefront-mobile-menu"
            aria-hidden={!menuOpen}
            aria-label="Navigasi mobile"
          >
            <div className="storefront-mobile-menu__items">
              <div className="storefront-mobile-menu__item">
                <Link onClick={closeMenu} to="/" className="storefront-mobile-menu__link">
                  Beranda
                </Link>
              </div>

              <div className="storefront-mobile-menu__item">
                <Link onClick={closeMenu} to="/menu" className="storefront-mobile-menu__link">
                  Menu camilan
                </Link>
              </div>

              <div className="storefront-mobile-menu__item">
                <Link onClick={closeMenu} to="/#cerita-kami" className="storefront-mobile-menu__link">
                  Cerita kami
                </Link>
              </div>

              <div className="storefront-mobile-menu__item">
                <Link onClick={closeMenu} to="/#cara-pesan" className="storefront-mobile-menu__link">
                  Cara pesan
                </Link>
              </div>

              <div className="storefront-mobile-menu__item">
                <Link onClick={closeMenu} to="/owner/login" className="storefront-mobile-menu__link">
                  Akses pengelola
                </Link>
              </div>
            </div>
          </nav>
      </header>

      {/* Main page content */}
      <main className="storefront-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="storefront-footer">
        <div className="storefront-footer__inner">
          <div className="footer-grid">
            <div>
              <BrandLockup
                dark
                name={storeName}
                tagline={storeTagline.toUpperCase()}
              />

              <p className="footer-brand__tagline mt-5 max-w-sm">
                {storeTagline} Kami menghadirkan pilihan camilan rumahan
                untuk menemani jeda kecil dan momen kebersamaan.
              </p>

              <div className="footer-meta mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/65">
                  Dibuat rumahan
                </span>

                <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/65">
                  Ready stock &amp; pre-order
                </span>
              </div>
            </div>

            <div className="footer-section">
              <h2>Jelajahi</h2>

              <ul className="footer-section__list">
                <li>
                  <Link to="/menu" className="footer-section__link">
                    Katalog camilan
                  </Link>
                </li>

                <li>
                  <Link to="/keranjang" className="footer-section__link">
                    Keranjang
                  </Link>
                </li>

                <li>
                  <Link to="/owner/login" className="footer-section__link">
                    Akses pengelola
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-section footer-contact">
              <h2>Hubungi kami</h2>

              <p className="footer-contact__copy mt-4 text-sm leading-6">
                Tanyakan ketersediaan, jadwal produksi, atau konfirmasi
                pesanan melalui kanal resmi.
              </p>

              <div className="footer-meta mt-4 flex flex-wrap gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social__link"
                  >
                    <MessageCircle size={15} />
                    WhatsApp
                  </a>
                ) : (
                  <span className="footer-social__link">
                    <MessageCircle size={15} />
                    WhatsApp belum diatur
                  </span>
                )}

                {instagramHref && (
                  <a
                    href={instagramHref}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-social__link"
                  >
                    <Camera size={15} />
                    Instagram
                  </a>
                )}
              </div>

              {storeInfo.instagramHandle && (
                <div className="mt-3 flex items-center gap-2 text-xs text-white/45">
                  <Camera size={13} />
                  @{instagramHandle}
                </div>
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <details className="group text-[10px] text-white/45">
              <summary className="cursor-pointer font-semibold tracking-wide text-white/60 transition hover:text-white">
                Catatan visual katalog
              </summary>

              <p className="mt-3 max-w-3xl leading-5">
                Gambar bawaan enam menu merupakan ilustrasi AI yang dibuat
                sebagai referensi tata letak katalog, bukan foto aktual
                produk atau bukti komposisi/ukuran. Owner dapat menggantinya
                dengan foto hasil produksi melalui dashboard.
              </p>
            </details>

            <div className="mt-4 text-center text-[10px] tracking-wide text-white/40">
              © {new Date().getFullYear()} {storeName}. Dibuat dengan rasa
              dan cerita rumahan.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
