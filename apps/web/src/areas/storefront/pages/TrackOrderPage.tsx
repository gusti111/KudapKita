import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderForCurrentGuest } from '@/data/repositories/orders.repository';
import type { OrderRecord } from '@/domain/entities/Order';
import { OrderStatusBadge, PaymentStatusBadge } from '@/shared/components/ui/StatusBadge';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';
import { useAuth } from '@/app/providers/AuthProvider';
import { Notice } from '@/shared/components/feedback/Notice';
import { formatRupiah } from '@/shared/utils/format';

export function TrackOrderPage() {
  const { orderId = '' } = useParams();
  const { loading: authLoading, firebaseReady } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (authLoading) return;
    if (!firebaseReady) { setLoading(false); return; }
    getOrderForCurrentGuest(orderId).then(setOrder).catch(() => setError('Status belum dapat dimuat.')).finally(() => setLoading(false));
  }, [authLoading, firebaseReady, orderId]);
  if (loading || authLoading) return <LoadingScreen label="Memeriksa pesanan…"/>;
  return <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6"><h1 className="font-serif text-3xl font-bold text-cocoa">Pelacakan pesanan</h1>{error ? <Notice tone="error">{error}</Notice> : !order ? <div className="mt-5"><Notice tone="warning">Pesanan tidak ditemukan pada sesi browser ini. Untuk menjaga privasi, pesanan hanya dapat dibaca oleh sesi pelanggan yang membuatnya. Hubungi admin melalui WhatsApp dan sertakan kode pesanan.</Notice><Link to="/menu" className="mt-5 inline-block text-sm font-semibold text-terracotta">Kembali ke katalog →</Link></div> : <div className="mt-6 rounded-2xl border border-stroke bg-white p-5"><div className="text-xs text-muted">Kode pesanan</div><div className="mt-1 break-all font-mono text-sm font-bold text-cocoa">{order.id}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="text-xs text-muted">Status pesanan</div><div className="mt-2"><OrderStatusBadge status={order.orderStatus}/></div></div><div><div className="text-xs text-muted">Status pembayaran</div><div className="mt-2"><PaymentStatusBadge status={order.paymentStatus}/></div></div></div>{order.confirmedTotal !== undefined && order.confirmedTotal !== null && <div className="mt-5 border-t border-stroke pt-4"><div className="text-xs text-muted">Total yang dikonfirmasi admin</div><div className="mt-1 text-xl font-bold text-cocoa">{formatRupiah(order.confirmedTotal)}</div></div>}<p className="mt-5 text-xs leading-5 text-muted">Status pembayaran diperbarui admin setelah pemeriksaan transaksi. Mengirim bukti melalui WhatsApp belum otomatis berarti pembayaran lunas.</p></div>}</section>;
}
