import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Boxes, CheckCircle2, ClipboardList, Plus, RefreshCw, ShoppingBasket, Wallet, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRecentOwnerOrders } from '@/data/repositories/orders.repository';
import { getVerifiedSalesAnalytics, listManagedProducts, listStock, type StockRecord, type VerifiedSalesAnalytics } from '@/data/repositories/owner-operations.repository';
import type { OrderRecord } from '@/domain/entities/Order';
import { OrderStatusBadge, PaymentStatusBadge } from '@/shared/components/ui/StatusBadge';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';
import { Notice } from '@/shared/components/feedback/Notice';
import { formatRupiah } from '@/shared/utils/format';

export function OwnerDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stock, setStock] = useState<StockRecord[]>([]);
  const [analytics, setAnalytics] = useState<VerifiedSalesAnalytics | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(true);
    setError('');
    try {
      const [nextOrders, nextStock, nextProducts, nextAnalytics] = await Promise.all([
        getRecentOwnerOrders(), listStock(), listManagedProducts(), getVerifiedSalesAnalytics(period),
      ]);
      setOrders(nextOrders);
      setStock(nextStock);
      setProductCount(nextProducts.length);
      setAnalytics(nextAnalytics);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ringkasan bisnis belum dapat dimuat. Periksa koneksi dan Security Rules Firebase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { void reload(); }, [reload]);

  const pending = orders.filter((order) => order.orderStatus === 'REQUESTED').length;
  const paymentReview = orders.filter((order) => order.paymentStatus === 'WAITING_VERIFICATION').length;
  const active = orders.filter((order) => ['WAITING_PAYMENT', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.orderStatus)).length;
  const completed = orders.filter((order) => order.orderStatus === 'COMPLETED').length;
  const stockZero = stock.filter((item) => item.updatedAt && item.availableQty <= 0);
  const stockUnits = stock.filter((item) => item.updatedAt).reduce((sum, item) => sum + Math.max(0, item.availableQty), 0);

  const bestSellers = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number }>();
    const addLine = (productId: string, productName: string, quantity: number) => {
      if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) return;
      const current = totals.get(productId) ?? { name: productName || productId, quantity: 0 };
      current.quantity += quantity;
      totals.set(productId, current);
    };
    const periodStart = new Date(); periodStart.setHours(0, 0, 0, 0); periodStart.setDate(periodStart.getDate() - ((analytics?.periodDays ?? 7) - 1));
    orders.filter((order) => {
      if (order.paymentStatus !== 'PAID') return false;
      const raw = order.createdAt as { toDate?: () => Date } | Date | string | number | null;
      const date = raw instanceof Date ? raw : raw && typeof raw === 'object' && typeof raw.toDate === 'function' ? raw.toDate() : raw ? new Date(raw as string | number) : null;
      return Boolean(date && !Number.isNaN(date.getTime()) && date >= periodStart);
    }).forEach((order) => {
      order.items.forEach((item) => addLine(item.productId, item.productName, item.quantity));
    });
    analytics?.directBestSellers.forEach((item) => addLine(item.productId, item.productName, item.quantity));
    return [...totals.entries()].map(([id, item]) => ({ id, ...item })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders, analytics]);

  const maxRevenue = Math.max(1, ...(analytics?.daily.map((point) => point.revenue) ?? [0]));
  const visiblePoints = analytics?.daily ?? [];

  return <div className="owner-dashboard-page">
    <header className="owner-dashboard-header">
      <div><p className="owner-kicker">Business overview</p><h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-cocoa sm:text-4xl">Ringkasan usaha.</h1><p className="mt-2 text-sm leading-6 text-muted">Pantau pesanan, pendapatan terverifikasi, dan kondisi persediaan dalam satu tempat.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void reload(false)} disabled={refreshing} className="owner-refresh-button"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/> Perbarui</button>
        <Link to="/owner/pesanan" className="owner-dashboard-primary-action"><ClipboardList size={16}/> Kelola pesanan</Link>
      </div>
    </header>

    {error && <div className="mt-5"><Notice tone="error">{error}</Notice></div>}
    {loading ? <div className="mt-7"><LoadingScreen/></div> : <>
      <section className="owner-dashboard-hero mt-7">
        <div className="relative z-10 max-w-2xl"><span className="owner-dashboard-hero__eyebrow">KudapKita · Owner workspace</span><h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">Bisnis lebih teratur, keputusan lebih jelas.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Ringkasan hanya membaca data yang tersimpan. Pendapatan dihitung dari transaksi yang sudah diverifikasi.</p></div>
        <div className="owner-dashboard-hero__actions"><Link to="/owner/produk"><Plus size={15}/> Tambah produk</Link><Link to="/owner/penjualan-langsung"><ShoppingBasket size={15}/> Catat penjualan</Link></div>
        <div className="owner-dashboard-hero-decoration" aria-hidden="true"/>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Metrik usaha">
        <MetricCard title="Pesanan terbaru" value={String(orders.length)} icon={<ClipboardList size={18}/>} detail={`${pending} permintaan baru · maksimal 100 terbaru`} tone="warm" />
        <MetricCard title="Perlu diperiksa" value={String(pending + paymentReview)} icon={<AlertTriangle size={18}/>} detail={`${paymentReview} bukti pembayaran menunggu`} tone="warning" />
        <MetricCard title="Pendapatan terverifikasi" value={formatRupiah(analytics?.totalRevenue ?? 0)} icon={<Wallet size={18}/>} detail={`${analytics?.verifiedTransactions ?? 0} transaksi · ${period} hari`} tone="sage" />
        <MetricCard title="Produk terkelola" value={String(productCount)} icon={<Boxes size={18}/>} detail={`${stockZero.length} saldo stok tercatat kosong`} tone="neutral" />
      </section>

      <section className="owner-dashboard-grid mt-6">
        <div className="owner-surface owner-analytics-panel">
          <div className="owner-surface-heading">
            <div><p className="owner-kicker">Performa penjualan</p><h2 className="mt-1 font-serif text-xl font-bold text-cocoa">Pendapatan terverifikasi</h2><p className="mt-1 text-xs text-muted">Pesanan online yang lunas dan penjualan langsung berstatus VERIFIED.</p></div>
            <label className="owner-period-select"><span className="sr-only">Periode analitik</span><select value={period} onChange={(event) => setPeriod(Number(event.target.value) as 7 | 30 | 90)}><option value={7}>7 hari</option><option value={30}>30 hari</option><option value={90}>90 hari</option></select></label>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-muted">Total periode</span><p className="mt-1 font-serif text-2xl font-extrabold text-cocoa">{formatRupiah(analytics?.totalRevenue ?? 0)}</p></div><span className="text-[11px] text-muted">{analytics?.verifiedTransactions ?? 0} transaksi tercatat</span></div>
            {visiblePoints.some((point) => point.revenue > 0) ? <SalesChart points={visiblePoints} maxRevenue={maxRevenue}/> : <div className="owner-chart-empty"><BarChart3 size={24}/><strong>Belum ada transaksi terverifikasi pada periode ini.</strong><span>Grafik akan terisi saat pembayaran pesanan online atau penjualan langsung telah tercatat sebagai VERIFIED.</span></div>}
            <div className="owner-revenue-sources mt-4 grid grid-cols-2 gap-3"><div><span>Pesanan online</span><strong>{formatRupiah(analytics?.onlineRevenue ?? 0)}</strong></div><div><span>Penjualan langsung</span><strong>{formatRupiah(analytics?.directRevenue ?? 0)}</strong></div></div>
            <p className="mt-3 text-[10px] text-muted">{(analytics?.previousTotalRevenue ?? 0) > 0 ? `Periode sebelumnya: ${formatRupiah(analytics?.previousTotalRevenue ?? 0)} · ${(analytics?.totalRevenue ?? 0) >= (analytics?.previousTotalRevenue ?? 0) ? 'naik' : 'turun'} ${Math.round(Math.abs(((analytics?.totalRevenue ?? 0) - (analytics?.previousTotalRevenue ?? 0)) / (analytics?.previousTotalRevenue ?? 1)) * 100)}%` : (analytics?.totalRevenue ?? 0) > 0 ? 'Belum ada transaksi terverifikasi pada periode pembanding.' : 'Belum ada transaksi terverifikasi pada periode ini maupun pembanding.'}</p>
          </div>
        </div>

        <div className="owner-surface">
          <div className="owner-surface-heading"><div><p className="owner-kicker">Operasional</p><h2 className="mt-1 font-serif text-xl font-bold text-cocoa">Status pesanan</h2><p className="mt-1 text-[10px] text-muted">Berdasarkan maks. 100 pesanan terbaru</p></div><Link to="/owner/pesanan" className="owner-text-link">Lihat semua</Link></div>
          <div className="space-y-4 p-4 sm:p-5">
            <StatusMetric label="Menunggu konfirmasi" value={pending} color="amber" />
            <StatusMetric label="Menunggu verifikasi pembayaran" value={paymentReview} color="rose" />
            <StatusMetric label="Dalam proses" value={active} color="sage" />
            <StatusMetric label="Selesai" value={completed} color="neutral" />
            <p className="border-t border-stroke pt-3 text-[11px] leading-5 text-muted">Permintaan baru, status pembayaran, dan progres pemenuhan dipisahkan agar tidak menghitung order yang belum lunas sebagai pendapatan.</p>
          </div>
        </div>
      </section>

      <section className="owner-dashboard-grid owner-dashboard-grid--bottom mt-6">
        <div className="owner-surface">
          <div className="owner-surface-heading"><div><p className="owner-kicker">Aktivitas terbaru</p><h2 className="mt-1 font-serif text-xl font-bold text-cocoa">Pesanan terbaru</h2></div><Link to="/owner/pesanan" className="owner-text-link">Buka inbox</Link></div>
          {orders.length === 0 ? <EmptyState title="Belum ada permintaan pesanan" copy="Pesanan pelanggan akan muncul di sini setelah checkout tersimpan."/> : <div className="divide-y divide-stroke">{orders.slice(0, 6).map((order) => <article key={order.id} className="owner-recent-order flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="truncate font-mono text-[11px] font-bold text-cocoa">{order.id}</p><p className="mt-1 text-sm font-semibold text-cocoa">{order.customerName}</p><p className="mt-1 text-xs text-muted">{order.items.length} jenis produk · {order.fulfillmentMethod === 'PICKUP' ? 'Ambil sendiri' : 'Pengantaran'}</p><div className="mt-2 flex flex-wrap gap-1.5"><OrderStatusBadge status={order.orderStatus}/><PaymentStatusBadge status={order.paymentStatus}/></div></div><div className="text-right"><p className="text-[10px] text-muted">{order.confirmedTotal ? 'Total dikonfirmasi' : 'Estimasi belum final'}</p><strong className="mt-1 block text-sm text-cocoa">{order.confirmedTotal ? formatRupiah(order.confirmedTotal) : 'Menunggu admin'}</strong></div></article>)}</div>}
        </div>

        <div className="grid content-start gap-5">
          <div className="owner-surface"><div className="owner-surface-heading"><div><p className="owner-kicker">Persediaan</p><h2 className="mt-1 font-serif text-xl font-bold text-cocoa">Perlu perhatian</h2></div><Link to="/owner/persediaan" className="owner-text-link">Kelola</Link></div>
            {stockZero.length === 0 ? <div className="p-5"><div className="flex items-center gap-3"><span className="owner-shortcut-icon"><CheckCircle2 size={18}/></span><div><strong className="text-sm text-cocoa">Tidak ada stok kosong yang tercatat.</strong><p className="mt-1 text-xs text-muted">{stockUnits} unit tercatat tersedia pada produk dengan pencatatan stok.</p></div></div></div> : <div className="space-y-2 p-4">{stockZero.slice(0, 5).map((item) => <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2.5"><span className="min-w-0 truncate text-xs font-semibold text-cocoa">{item.productName}</span><span className="shrink-0 text-[11px] font-bold text-rose-700">0 {item.unit}</span></div>)}<p className="text-[10px] text-muted">Hanya produk dengan saldo stok yang pernah dicatat yang ditampilkan sebagai peringatan.</p></div>}
          </div>
          <div className="owner-surface"><div className="owner-surface-heading"><div><p className="owner-kicker">Paling diminati</p><h2 className="mt-1 font-serif text-xl font-bold text-cocoa">Produk terlaris</h2></div><span className="text-[10px] text-muted">Unit terjual</span></div>
            {bestSellers.length === 0 ? <EmptyState title="Belum ada data produk terlaris" copy="Peringkat akan muncul setelah ada transaksi yang sudah lunas atau penjualan langsung terverifikasi."/> : <div className="space-y-3 p-4">{bestSellers.map((item, index) => <div key={item.id} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cream text-[11px] font-extrabold text-cocoa">{index + 1}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-cocoa">{item.name}</span><strong className="shrink-0 text-xs tabular-nums text-cocoa">{item.quantity}</strong></div>)}</div>}
          </div>
        </div>
      </section>
    </>}
  </div>;
}

function MetricCard({ title, value, icon, detail, tone }: { title: string; value: string; icon: ReactNode; detail: string; tone: 'warm' | 'warning' | 'sage' | 'neutral' }) {
  return <article className={`owner-metric-card owner-metric-card--${tone}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-muted">{title}</span><span className="owner-metric-icon">{icon}</span></div><strong className="mt-4 block truncate font-serif text-2xl font-extrabold tracking-tight text-cocoa">{value}</strong><span className="mt-1 block text-[11px] text-muted">{detail}</span></article>;
}

function StatusMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs text-muted"><i className={`status-dot status-dot--${color}`}/>{label}</span><strong className="text-sm tabular-nums text-cocoa">{value}</strong></div>;
}

function SalesChart({ points, maxRevenue }: { points: VerifiedSalesAnalytics['daily']; maxRevenue: number }) {
  const width = 720;
  const height = 220;
  const horizontalPadding = 18;
  const verticalPadding = 18;
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;
  const coords = points.map((point, index) => ({
    x: horizontalPadding + (points.length <= 1 ? 0 : (index / (points.length - 1)) * usableWidth),
    y: height - verticalPadding - (point.revenue / maxRevenue) * usableHeight,
  }));
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${width - horizontalPadding} ${height - verticalPadding} L ${horizontalPadding} ${height - verticalPadding} Z`;
  const labelStep = points.length > 30 ? 10 : points.length > 14 ? 5 : 1;
  return <div className="owner-sales-chart mt-5">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Grafik pendapatan terverifikasi selama ${points.length} hari`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => <line key={fraction} x1={horizontalPadding} x2={width - horizontalPadding} y1={verticalPadding + usableHeight * fraction} y2={verticalPadding + usableHeight * fraction} className="chart-grid-line"/>)}
      <path d={area} className="chart-area"/><path d={path} className="chart-line"/>
      {coords.map((point, index) => <circle key={points[index].dateKey} cx={point.x} cy={point.y} r={points.length > 30 ? 2.2 : 3.3} className="chart-point"><title>{points[index].label}: {formatRupiah(points[index].revenue)}</title></circle>)}
    </svg>
    <div className="owner-chart-labels">{points.map((point, index) => <span key={point.dateKey} className={index % labelStep === 0 || index === points.length - 1 ? '' : 'is-hidden'}>{point.label}</span>)}</div>
    <div className="mt-4 flex items-center justify-between text-[10px] text-muted"><span>{points[0]?.dateKey ?? '—'}</span><span>{points[points.length - 1]?.dateKey ?? '—'}</span></div>
  </div>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="p-5"><p className="text-sm font-semibold text-cocoa">{title}</p><p className="mt-1 text-xs leading-5 text-muted">{copy}</p></div>;
}
