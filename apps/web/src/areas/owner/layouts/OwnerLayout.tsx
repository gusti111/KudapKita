import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { BarChart3, Boxes, ClipboardList, Coffee, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingBasket, Tags, X } from 'lucide-react';
import { auth } from '@/infrastructure/firebase/client';
import { useAuth } from '@/app/providers/AuthProvider';

const navigation = [
  { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/owner/pesanan', label: 'Pesanan', icon: ClipboardList },
  { to: '/owner/produk', label: 'Produk', icon: Package },
  { to: '/owner/kategori', label: 'Kategori', icon: Tags },
  { to: '/owner/produksi', label: 'Produksi', icon: Coffee },
  { to: '/owner/persediaan', label: 'Persediaan', icon: Boxes },
  { to: '/owner/penjualan-langsung', label: 'Penjualan langsung', icon: ShoppingBasket },
  { to: '/owner/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/owner/pengaturan', label: 'Pengaturan', icon: Settings },
];
const primaryNavigation = navigation.slice(0, 3);
const secondaryNavigation = navigation.slice(3);

export function OwnerLayout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [moreOpen]);
  async function logout() { if (auth) await signOut(auth); navigate('/owner/login', { replace: true }); }
  return <div className="owner-layout min-h-screen bg-[#F6F5F1] text-ink lg:grid lg:grid-cols-[250px_1fr]" data-owner-theme="dark">
    <aside className="owner-sidebar hidden border-r border-stroke bg-white lg:flex lg:flex-col"><div className="flex h-20 items-center gap-3 border-b border-stroke px-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa font-serif text-lg font-bold text-white">K</div><div><div className="font-serif text-lg font-bold text-cocoa">KudapKita</div><div className="text-[10px] uppercase tracking-wider text-muted">Owner workspace</div></div></div><nav className="flex-1 space-y-1 p-4">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `owner-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'owner-nav-active bg-[#F3E8DB] text-cocoa' : 'text-muted hover:bg-cream hover:text-cocoa'}`}><Icon size={17}/>{label}</NavLink>)}</nav><div className="border-t border-stroke p-4"><div className="mb-3 truncate text-xs text-muted">{profile?.displayName || profile?.email || 'Owner'}</div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700"><LogOut size={17}/> Keluar</button></div></aside>
    <div className="owner-workspace min-w-0"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stroke bg-white/95 px-4 backdrop-blur sm:px-6"><div className="font-semibold text-cocoa lg:hidden">KudapKita · Owner</div><div className="hidden text-sm text-muted lg:block">Business management workspace</div><div className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{profile?.displayName || 'Owner'}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-[#E8D9C8] text-xs font-bold text-cocoa">{(profile?.displayName || 'O').slice(0,1).toUpperCase()}</span><button onClick={logout} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-700 lg:hidden" aria-label="Keluar"><LogOut size={17}/></button></div></header><nav className="owner-mobile-bottom-nav lg:hidden" aria-label="Navigasi utama owner">
      {primaryNavigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `owner-mobile-nav-item ${isActive ? 'is-active' : ''}`}>
          <Icon size={19} /><span>{label}</span>
        </NavLink>
      ))}
      <button type="button" className={`owner-mobile-nav-item ${moreOpen ? 'is-active' : ''}`} aria-expanded={moreOpen} aria-controls="owner-mobile-drawer" onClick={() => setMoreOpen((open) => !open)}>
        {moreOpen ? <X size={19} /> : <Menu size={19} />}<span>Lainnya</span>
      </button>
    </nav>
    {moreOpen && <>
      <button type="button" className="owner-mobile-backdrop lg:hidden" aria-label="Tutup menu pengelolaan" onClick={() => setMoreOpen(false)} />
      <section id="owner-mobile-drawer" className="owner-mobile-drawer lg:hidden" role="dialog" aria-modal="true" aria-labelledby="owner-mobile-drawer-title">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-terracotta">Workspace</p>
            <h2 id="owner-mobile-drawer-title" className="mt-1 font-serif text-xl font-bold text-cocoa">Menu pengelolaan</h2>
            <p className="mt-1 text-xs text-muted">Akses semua modul operasional KudapKita.</p>
          </div>
          <button type="button" onClick={() => setMoreOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stroke text-muted" aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {secondaryNavigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMoreOpen(false)} className={({ isActive }) => `flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${isActive ? 'border-[#D6B99A] bg-[#F3E8DB] text-cocoa' : 'border-stroke bg-white text-muted hover:bg-cream hover:text-cocoa'}`}>
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mt-4 border-t border-stroke pt-3">
          <p className="mb-2 truncate text-xs text-muted">Masuk sebagai {profile?.displayName || profile?.email || 'Owner'}</p>
          <button type="button" onClick={() => void logout()} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={17} /> Keluar dari workspace</button>
        </div>
      </section>
    </>}
      <main className="owner-main mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>;
}
