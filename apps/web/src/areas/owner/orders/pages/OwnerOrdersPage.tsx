import { useEffect, useState } from 'react';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { getRecentOwnerOrders, setOwnerOrderQuote, setOwnerOrderStatus, verifyOwnerPayment } from '@/data/repositories/orders.repository';
import type { OrderRecord, OrderStatus } from '@/domain/entities/Order';
import { OrderStatusBadge, PaymentStatusBadge } from '@/shared/components/ui/StatusBadge';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';
import { Notice } from '@/shared/components/feedback/Notice';
import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatRupiah } from '@/shared/utils/format';

export function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('ALL'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function reload() { setLoading(true); setError(''); try { setOrders(await getRecentOwnerOrders()); } catch (loadError) { setError(getErrorMessage(loadError, 'Pesanan gagal dimuat.')); } finally { setLoading(false); } }
  useEffect(() => { void reload(); }, []);
  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    const matchesSearch = !query || `${order.id} ${order.customerName} ${order.customerWhatsApp}`.toLocaleLowerCase('id-ID').includes(query);
    return matchesSearch && (statusFilter === 'ALL' || order.orderStatus === statusFilter);
  });
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">Operasional</span><h1 className="mt-2 font-serif text-3xl font-bold text-cocoa">Manajemen pesanan</h1><p className="mt-1 text-sm text-muted">Periksa permintaan, konfirmasi total, verifikasi pembayaran, dan perbarui progres.</p></div><PrimaryButton tone="secondary" onClick={() => void reload()}><RefreshCw size={15}/> Muat ulang</PrimaryButton></div>{error && <div className="mt-5"><Notice tone="error">{error}</Notice></div>}
    <div className="owner-order-toolbar mt-6 grid gap-3 rounded-2xl border border-stroke bg-white p-3 sm:grid-cols-[minmax(0,1fr)_230px] sm:p-4">
      <label className="relative block"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode pesanan, nama, atau WhatsApp…" className="h-11 w-full rounded-xl border border-stroke bg-cream/60 pl-10 pr-3 text-sm outline-none focus:border-terracotta" aria-label="Cari pesanan"/></label>
      <label className="relative block"><SlidersHorizontal size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-stroke bg-white pl-10 pr-3 text-sm text-cocoa outline-none focus:border-terracotta" aria-label="Filter status pesanan"><option value="ALL">Semua status</option><option value="REQUESTED">Permintaan baru</option><option value="WAITING_PAYMENT">Menunggu pembayaran</option><option value="PREPARING">Sedang disiapkan</option><option value="READY_FOR_PICKUP">Siap diambil</option><option value="OUT_FOR_DELIVERY">Dalam pengantaran</option><option value="COMPLETED">Selesai</option><option value="REJECTED">Ditolak</option></select></label>
    </div>
    <p className="mt-3 text-xs text-muted">Menampilkan {loading ? '…' : filteredOrders.length} dari {orders.length} pesanan terbaru yang diambil.</p>
    {loading ? <LoadingScreen/> : orders.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-stroke bg-white p-12 text-center text-sm text-muted">Belum ada permintaan pesanan.</div> : filteredOrders.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-stroke bg-white p-10 text-center text-sm text-muted">Tidak ada pesanan yang cocok dengan pencarian atau filter ini.</div> : <div className="mt-5 space-y-3">{filteredOrders.map((order) => <OwnerOrderCard key={order.id} order={order} onUpdated={reload} onError={setError}/>)}</div>}</div>;
}

function OwnerOrderCard({ order, onUpdated, onError }: { order: OrderRecord; onUpdated: () => Promise<void>; onError: (message: string) => void }) {
  const [amount, setAmount] = useState(order.confirmedTotal?.toString() ?? '');
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'QRIS'>('BANK_TRANSFER');
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) { setBusy(true); onError(''); try { await action(); await onUpdated(); } catch (error) { onError(getErrorMessage(error)); } finally { setBusy(false); } }
  async function saveQuote() {
    const total = Number(amount);
    await run(() => setOwnerOrderQuote(order.id, total));
  }
  async function verifyPayment() {
    const confirmed = window.confirm('Apakah nominal dan transaksi sudah benar-benar diperiksa pada rekening atau aplikasi merchant?');
    if (!confirmed) return;
    await run(() => verifyOwnerPayment(order.id, method));
  }
  const nextStatus: OrderStatus | null = order.orderStatus === 'WAITING_PAYMENT' && order.paymentStatus === 'PAID'
    ? 'PREPARING'
    : order.orderStatus === 'PREPARING'
      ? (order.fulfillmentMethod === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY')
      : (order.orderStatus === 'READY_FOR_PICKUP' || order.orderStatus === 'OUT_FOR_DELIVERY') ? 'COMPLETED' : null;
  return <article className="rounded-2xl border border-stroke bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-xs font-bold text-cocoa">{order.id}</div><h2 className="mt-2 font-semibold text-cocoa">{order.customerName}</h2><p className="mt-1 text-xs text-muted">{order.customerWhatsApp} · {order.fulfillmentMethod === 'PICKUP' ? 'Ambil sendiri' : 'Pengantaran'}</p></div><div className="flex flex-wrap gap-2"><OrderStatusBadge status={order.orderStatus}/><PaymentStatusBadge status={order.paymentStatus}/></div></div><div className="mt-4 border-t border-stroke pt-4"><div className="text-xs font-semibold text-muted">Item pesanan</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{order.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex justify-between gap-2 text-sm"><span>{item.productName}</span><span className="font-semibold">× {item.quantity}</span></div>)}</div>{order.deliveryAddress && <p className="mt-3 text-xs text-muted">Alamat: {order.deliveryAddress}</p>}{order.customerNote && <p className="mt-2 text-xs text-muted">Catatan: {order.customerNote}</p>}</div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stroke pt-4">{order.confirmedTotal !== undefined ? <div><div className="text-xs text-muted">Total terkonfirmasi</div><div className="mt-1 font-bold text-cocoa">{formatRupiah(order.confirmedTotal)}</div></div> : <div className="text-xs text-muted">Total akhir belum ditetapkan.</div>}
    {order.orderStatus === 'REQUESTED' && <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`amount-${order.id}`}>Total akhir dalam rupiah</label><input id={`amount-${order.id}`} type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Total akhir (Rp)" className="h-10 w-36 rounded-lg border border-stroke px-3 text-xs"/><PrimaryButton disabled={busy || !amount} onClick={() => void saveQuote()}>{busy ? 'Menyimpan…' : 'Konfirmasi total'}</PrimaryButton><PrimaryButton tone="quiet" disabled={busy} onClick={() => void run(() => setOwnerOrderStatus(order.id, 'REJECTED'))}>Tolak</PrimaryButton></div>}
    {order.orderStatus === 'WAITING_PAYMENT' && order.paymentStatus === 'WAITING_VERIFICATION' && <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`method-${order.id}`}>Metode pembayaran</label><select id={`method-${order.id}`} value={method} onChange={(event) => setMethod(event.target.value as 'BANK_TRANSFER' | 'QRIS')} className="h-10 rounded-lg border border-stroke bg-white px-3 text-xs"><option value="BANK_TRANSFER">Transfer bank</option><option value="QRIS">QRIS</option></select><PrimaryButton disabled={busy} onClick={() => void verifyPayment()}>{busy ? 'Memverifikasi…' : 'Tandai pembayaran terverifikasi'}</PrimaryButton></div>}
    {order.orderStatus === 'WAITING_PAYMENT' && order.paymentStatus === 'UNPAID' && <p className="text-xs text-muted">Menunggu pelanggan mengirim bukti pembayaran. Status belum dianggap lunas.</p>}
    {order.orderStatus === 'WAITING_PAYMENT' && order.paymentStatus === 'REJECTED' && <p className="text-xs font-medium text-rose-700">Bukti pembayaran ditolak. Menunggu tindak lanjut pelanggan.</p>}
    {nextStatus && <PrimaryButton disabled={busy} onClick={() => void run(() => setOwnerOrderStatus(order.id, nextStatus))}>{busy ? 'Memperbarui…' : nextStatus === 'PREPARING' ? 'Mulai produksi' : nextStatus === 'COMPLETED' ? 'Tandai selesai' : order.fulfillmentMethod === 'PICKUP' ? 'Siap diambil' : 'Mulai pengantaran'}</PrimaryButton>}
    </div><p className="mt-3 text-[11px] leading-5 text-muted">Verifikasi pembayaran hanya dilakukan setelah owner mencocokkan transaksi sebenarnya. Bukti yang dikirim melalui WhatsApp tidak otomatis mengubah status menjadi lunas.</p>
  </article>;
}
