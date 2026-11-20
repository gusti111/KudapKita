import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, ScanLine, ShieldX } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/infrastructure/firebase/client';
import { consumeOwnerPairing, getOwnerPairingStatus, requestOwnerPairing } from '@/data/repositories/pairing.repository';

type PairingViewState = 'READY' | 'REQUESTED' | 'APPROVED' | 'SUCCESS' | 'REJECTED' | 'ERROR';

export function OwnerPairingPage() {
  const [challengeId, setChallengeId] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<PairingViewState>('READY');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setChallengeId(params.get('challenge') || '');
    setToken(params.get('token') || '');
  }, []);

  useEffect(() => () => controlsRef.current?.stop(), []);

  useEffect(() => {
    if (!challengeId || !token) return;
    const firebaseAuth = auth;
    if (!firebaseAuth || !isFirebaseConfigured) {
      setStatus('ERROR');
      setMessage('QR pairing tidak lengkap atau Firebase belum dikonfigurasi.');
      return;
    }
    let active = true;
    let timer: number | undefined;
    void (async () => {
      try {
        if (!firebaseAuth.currentUser) await signInAnonymously(firebaseAuth);
        const deviceLabel = (navigator.platform || 'Perangkat') + (navigator.userAgent.includes('Mobile') ? ' · Ponsel' : ' · Perangkat Owner');
        await requestOwnerPairing(challengeId, token, deviceLabel.slice(0, 80));
        if (!active) return;
        setStatus('REQUESTED');
        setMessage('Permintaan dikirim. Buka perangkat Owner utama dan setujui perangkat ini.');
        const deadline = Date.now() + 120_000;
        timer = window.setInterval(async () => {
          if (!active) return;
          if (Date.now() > deadline) {
            if (timer) window.clearInterval(timer);
            setStatus('ERROR');
            setMessage('Permintaan pairing kedaluwarsa. Silakan pindai QR baru.');
            return;
          }
          try {
            const next = await getOwnerPairingStatus(challengeId);
            if (next.status === 'APPROVED') {
              if (timer) window.clearInterval(timer);
              setStatus('APPROVED');
              setMessage('Permintaan disetujui. Menyelesaikan koneksi…');
              const customToken = await consumeOwnerPairing(challengeId, token);
              if (!active) return;
              await signInWithCustomToken(firebaseAuth, customToken);
              if (!active) return;
              setStatus('SUCCESS');
              setMessage('Perangkat berhasil dihubungkan sebagai perangkat Owner.');
              window.history.replaceState(null, '', '/owner');
            } else if (next.status === 'REJECTED' || next.status === 'EXPIRED') {
              if (timer) window.clearInterval(timer);
              setStatus('REJECTED');
              setMessage(next.status === 'EXPIRED' ? 'QR pairing telah kedaluwarsa.' : 'Permintaan ditolak oleh Owner.');
            }
          } catch (error) {
            if (timer) window.clearInterval(timer);
            setStatus('ERROR');
            setMessage(error instanceof Error ? error.message : 'Pairing gagal diproses.');
          }
        }, 2000);
      } catch (error) {
        if (!active) return;
        setStatus('ERROR');
        setMessage(error instanceof Error ? error.message : 'Pairing gagal diproses.');
      }
    })();
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [challengeId, token]);

  async function scanQr() {
    if (!videoRef.current || scanning) return;
    setScanning(true);
    setMessage('Arahkan kamera ke QR pada perangkat Owner…');
    try {
      readerRef.current = new BrowserQRCodeReader();
      controlsRef.current = await readerRef.current.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (result) => {
          if (!result) return;
          try {
            const url = new URL(result.getText());
            const params = new URLSearchParams(url.hash.replace(/^#/, ''));
            const nextChallenge = params.get('challenge') || '';
            const nextToken = params.get('token') || '';
            if (!nextChallenge || !nextToken || url.pathname !== '/owner/pasangkan') {
              setMessage('QR bukan kode pairing KudapKita yang valid.');
              return;
            }
            controlsRef.current?.stop();
            setScanning(false);
            setChallengeId(nextChallenge);
            setToken(nextToken);
            window.history.replaceState(null, '', url.pathname + url.hash);
          } catch {
            setMessage('Format QR tidak valid. Arahkan kembali ke kode pairing KudapKita.');
          }
        },
      );
    } catch (error) {
      setScanning(false);
      setMessage(error instanceof Error ? error.message : 'Kamera tidak dapat diakses.');
    }
  }

  const icon = status === 'SUCCESS'
    ? <CheckCircle2 className="mx-auto text-emerald-700" size={36}/>
    : status === 'ERROR' || status === 'REJECTED'
      ? <ShieldX className="mx-auto text-rose-700" size={36}/>
      : <LoaderCircle className="mx-auto animate-spin text-terracotta" size={32}/>;

  return <main className="grid min-h-screen place-items-center bg-cream px-4 py-10">
    <section className="owner-surface w-full max-w-md rounded-3xl border border-stroke bg-white p-6 text-center shadow-xl sm:p-8">
      {icon}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-terracotta">KudapKita · Device security</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-cocoa">{status === 'SUCCESS' ? 'Perangkat terhubung' : 'Hubungkan perangkat Owner'}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{message || 'Pindai QR yang ditampilkan pada akun Owner utama.'}</p>
      {!challengeId && <div className="mt-5">
        <video ref={videoRef} className="aspect-square w-full rounded-2xl bg-cocoa object-cover" muted playsInline/>
        <button type="button" onClick={() => void scanQr()} disabled={scanning} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cocoa px-5 text-sm font-bold text-white disabled:opacity-50">
          <ScanLine size={16}/>{scanning ? 'Memindai…' : 'Aktifkan kamera & pindai QR'}
        </button>
      </div>}
      {status === 'SUCCESS' && <a href="/owner" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-cocoa px-5 text-sm font-bold text-white">Buka dashboard Owner</a>}
      {(status === 'REJECTED' || status === 'ERROR') && <button type="button" onClick={() => { window.location.href = '/owner/pasangkan'; }} className="mt-5 min-h-11 rounded-full border border-stroke px-5 text-sm font-bold text-cocoa">Coba lagi</button>}
    </section>
  </main>;
}
