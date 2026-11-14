import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';
import { Notice } from '@/shared/components/feedback/Notice';
import { getErrorMessage } from '@/shared/utils/errors';

export function OwnerLoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/owner';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!auth || !db) { setError('Firebase belum dikonfigurasi. Isi file .env.local terlebih dahulu.'); return; }
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getDoc(doc(db, 'userProfiles', credential.user.uid));
      if (!profile.exists() || profile.data().role !== 'owner' || profile.data().isActive !== true) {
        await signOut(auth);
        throw new Error('Akun ini belum memiliki akses owner. Hubungi pengelola sistem.');
      }
      navigate(redirectTo, { replace: true });
    } catch (loginError) { setError(getErrorMessage(loginError, 'Login gagal. Periksa email dan password.')); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen bg-cream md:grid-cols-2"><section className="hidden flex-col justify-between bg-cocoa p-10 text-white md:flex"><Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70"><ArrowLeft size={16}/> KudapKita storefront</Link><div><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl">K</div><h1 className="max-w-md font-serif text-5xl font-bold leading-tight">Kelola usaha dengan lebih teratur.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/65">Ruang kerja privat untuk mengelola katalog, pesanan, pembayaran, produksi, dan laporan KudapKita.</p></div><p className="text-xs text-white/40">Akses khusus pengelola. Jangan bagikan kredensial owner.</p></section><section className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-md"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted md:hidden"><ArrowLeft size={16}/> Kembali ke toko</Link><div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-cocoa text-white"><LockKeyhole size={21}/></div><span className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">Owner workspace</span><h2 className="mt-2 font-serif text-3xl font-bold text-cocoa">Masuk ke dashboard</h2><p className="mt-2 text-sm leading-6 text-muted">Gunakan akun owner yang telah disiapkan oleh pengelola sistem.</p>{!isFirebaseConfigured && <div className="mt-5"><Notice tone="warning">Mode konfigurasi: Firebase belum aktif. Login tidak dapat digunakan sebelum .env.local diisi.</Notice></div>}<form onSubmit={submit} className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-cocoa">Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border border-stroke bg-white px-4 font-normal outline-none focus:border-terracotta" placeholder="owner@kudapkita.id"/></label><label className="grid gap-2 text-sm font-semibold text-cocoa">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border border-stroke bg-white px-4 font-normal outline-none focus:border-terracotta" placeholder="Masukkan password"/></label>{error && <Notice tone="error">{error}</Notice>}<PrimaryButton type="submit" disabled={busy || !isFirebaseConfigured}>{busy ? 'Memeriksa akses…' : 'Masuk sebagai owner'}</PrimaryButton></form><p className="mt-6 text-center text-xs leading-5 text-muted">Tidak ada registrasi owner publik. Akun dan perannya dikelola melalui Firebase Console.</p></div></section></main>;
}
