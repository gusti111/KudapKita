import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { BarChart3, Boxes, ClipboardList, Coffee, CreditCard, LayoutDashboard, LogOut, Package, Settings, ShoppingBasket, Tags } from 'lucide-react';
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
export function OwnerLayout() {
  const { profile } = useAuth(); const navigate = useNavigate();
  async function logout() { if (auth) await signOut(auth); navigate('/owner/login', { replace: true }); }
  return <div className="min-h-screen bg-[#F6F5F1] text-ink lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="hidden border-r border-stroke bg-white lg:flex lg:flex-col"><div className="flex h-20 items-center gap-3 border-b border-stroke px-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cocoa font-serif text-lg font-bold text-white">K</div><div><div className="font-serif text-lg font-bold text-cocoa">KudapKita</div><div className="text-[10px] uppercase tracking-wider text-muted">Owner workspace</div></div></div><nav className="flex-1 space-y-1 p-4">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[#F3E8DB] text-cocoa' : 'text-muted hover:bg-cream hover:text-cocoa'}`}><Icon size={17}/>{label}</NavLink>)}</nav><div className="border-t border-stroke p-4"><div className="mb-3 truncate text-xs text-muted">{profile?.displayName || profile?.email || 'Owner'}</div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700"><LogOut size={17}/> Keluar</button></div></aside>
    <div className="min-w-0"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stroke bg-white/95 px-4 backdrop-blur sm:px-6"><div className="font-semibold text-cocoa lg:hidden">KudapKita · Owner</div><div className="hidden text-sm text-muted lg:block">Business management workspace</div><div className="flex items-center gap-3"><span className="hidden text-xs text-muted sm:inline">{profile?.displayName || 'Owner'}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-[#E8D9C8] text-xs font-bold text-cocoa">{(profile?.displayName || 'O').slice(0,1).toUpperCase()}</span><button onClick={logout} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-700 lg:hidden" aria-label="Keluar"><LogOut size={17}/></button></div></header><div className="border-b border-stroke bg-white px-2 py-2 lg:hidden"><nav className="flex gap-1 overflow-x-auto">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${isActive ? 'bg-cocoa text-white' : 'text-muted hover:bg-cream'}`}><Icon size={14}/>{label}</NavLink>)}</nav></div><main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet/></main></div>
  </div>;
}
