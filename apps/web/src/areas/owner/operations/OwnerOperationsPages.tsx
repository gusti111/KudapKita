import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Archive, CheckCircle2, Factory, Plus, RefreshCw, Save, Settings,
} from 'lucide-react';
import {
  archiveManagedProduct, adjustFinishedStock, createDirectSale, getStoreSettings,
  getVerifiedSalesSummary, listCategories, listManagedProducts, listRecentProductionRuns,
  listStock, listStockMovements, recordProduction, saveCategory, saveManagedProduct,
  saveStoreSettings, type CategoryRecord, type DirectSaleLine, type ManagedProduct,
  type ProductInput, type StockRecord,
} from '@/data/repositories/owner-operations.repository';
import { formatRupiah } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/errors';

function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await load()); }
    catch (reason) { setError(getErrorMessage(reason, 'Data gagal dimuat.')); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload, setError };
}

function Heading({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-terracotta">{kicker}</p><h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-cocoa sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></div>
    {action}
  </header>;
}
function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="owner-surface rounded-2xl border border-stroke p-4 shadow-sm sm:p-6"><div className="mb-5"><h2 className="font-serif text-lg font-bold text-cocoa">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}</div>{children}</section>;
}
function Feedback({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}</>;
}
function Input({ label, value, onChange, type = 'text', required = false, min, step, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: number; step?: number; placeholder?: string;
}) {
  const id = 'field-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <label htmlFor={id} className="grid gap-1.5 text-xs font-semibold text-cocoa">{label}
    <input id={id} value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} min={min} step={step} placeholder={placeholder} className="h-11 min-w-0 rounded-xl border border-stroke bg-white px-3 text-sm font-normal text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10"/>
  </label>;
}
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = 'field-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <label htmlFor={id} className="grid gap-1.5 text-xs font-semibold text-cocoa">{label}
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 rounded-xl border border-stroke bg-white px-3 text-sm font-normal text-ink">{children}</select>
  </label>;
}
function Button({ children, onClick, type = 'button', disabled = false, tone = 'primary' }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: 'primary' | 'secondary' | 'danger';
}) {
  const tones = {
    primary: 'bg-cocoa text-white hover:bg-[#493127]',
    secondary: 'border border-stroke bg-white text-cocoa hover:bg-cream',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ' + tones[tone]}>{children}</button>;
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-stroke bg-cream/40 p-8 text-center text-sm text-muted">{children}</div>;
}
function Busy() { return <div className="flex items-center gap-2 py-6 text-sm text-muted"><RefreshCw size={16} className="animate-spin"/> Memuat data…</div>; }
function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function safeDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value.toDate() as Date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return '—';
}

type ProductDraft = {
  name: string; slug: string; shortDescription: string; categoryId: string;
  price: string; hpp: string; unit: string; imagePath: string;
  availability: ManagedProduct['availability']; isPublished: boolean; sortOrder: string;
};
const emptyProduct: ProductDraft = {
  name: '', slug: '', shortDescription: '', categoryId: '', price: '',
  hpp: '', unit: 'pcs', imagePath: '', availability: 'AVAILABLE',
  isPublished: true, sortOrder: '0',
};

export function OwnerProductsPage() {
  const productsResource = useResource(listManagedProducts);
  const categoriesResource = useResource(listCategories);
  const products = productsResource.data ?? [];
  const categories = (categoriesResource.data ?? []).filter((item) => item.isActive);
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  function edit(item: ManagedProduct) {
    setEditingId(item.id);
    setDraft({ name: item.name, slug: item.slug, shortDescription: item.shortDescription, categoryId: item.categoryId, price: item.price == null ? '' : String(item.price), hpp: item.hpp == null ? '' : String(item.hpp), unit: item.unit, imagePath: item.imagePath ?? '', availability: item.availability, isPublished: item.isPublished, sortOrder: String(item.sortOrder) });
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const category = categories.find((item) => item.id === draft.categoryId);
      if (!category) throw new Error('Buat dan pilih kategori aktif terlebih dahulu.');
      const data: ProductInput = {
        ...draft, name: draft.name.trim(), slug: draft.slug || slugify(draft.name),
        categoryName: category.name, price: draft.price.trim() ? Number(draft.price) : null,
        hpp: draft.hpp.trim() ? Number(draft.hpp) : null, sortOrder: Number(draft.sortOrder),
        isArchived: false,
      };
      await saveManagedProduct(data, editingId || undefined);
      setDraft(emptyProduct); setEditingId('');
      setSuccess('Produk berhasil disimpan dan katalog publik telah diperbarui.');
      await productsResource.reload();
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setSaving(false); }
  }
  async function archive(item: ManagedProduct) {
    if (!window.confirm('Arsipkan produk ' + item.name + '?')) return;
    setError(''); setSuccess('');
    try { await archiveManagedProduct(item.id); setSuccess('Produk diarsipkan.'); await productsResource.reload(); }
    catch (reason) { setError(getErrorMessage(reason)); }
  }
  return <div>
    <Heading kicker="Katalog & menu" title="Produk" description="Kelola nama, harga jual, HPP privat, foto, ketersediaan, dan publikasi produk." action={<Button onClick={() => { setDraft(emptyProduct); setEditingId(''); }}><Plus size={15}/> Produk baru</Button>}/>
    <Feedback error={error || productsResource.error} success={success}/>
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Panel title="Daftar produk" description="Produk privat menyimpan HPP. Katalog pelanggan hanya menerima proyeksi data publik.">
        {productsResource.loading ? <Busy/> : products.length === 0 ? <Empty>Belum ada produk. Tambahkan produk melalui formulir.</Empty> : <div className="space-y-2">
          {products.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stroke bg-white p-3">
            <div className="min-w-0"><p className="font-semibold text-cocoa">{item.name}</p><p className="mt-1 text-xs text-muted">{item.categoryName} · {item.unit} · {item.isPublished ? 'Tayang' : 'Disembunyikan'}</p></div>
            <div className="flex items-center gap-2"><strong className="text-xs">{item.price == null ? 'Harga kosong' : formatRupiah(item.price)}</strong><Button tone="secondary" onClick={() => edit(item)}>Edit</Button><Button tone="danger" onClick={() => void archive(item)} aria-label={'Arsipkan ' + item.name}><Archive size={15}/></Button></div>
          </article>)}
        </div>}
      </Panel>
      <Panel title={editingId ? 'Edit produk' : 'Tambah produk'} description="Perubahan harga dan HPP akan tersimpan sesuai akses masing-masing.">
        <form onSubmit={(event) => void submit(event)} className="grid gap-3">
          <Input label="Nama produk" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value, slug: editingId ? current.slug : slugify(value) }))} required/>
          <Input label="Slug" value={draft.slug} onChange={(value) => setDraft((current) => ({ ...current, slug: value }))} required/>
          <Select label="Kategori" value={draft.categoryId} onChange={(value) => setDraft((current) => ({ ...current, categoryId: value }))}><option value="">Pilih kategori</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</Select>
          <Input label="Deskripsi singkat" value={draft.shortDescription} onChange={(value) => setDraft((current) => ({ ...current, shortDescription: value }))}/>
          <div className="grid gap-3 sm:grid-cols-2"><Input label="Harga jual (Rp)" value={draft.price} onChange={(value) => setDraft((current) => ({ ...current, price: value }))} type="number" min={0} step={1}/><Input label="HPP privat (Rp)" value={draft.hpp} onChange={(value) => setDraft((current) => ({ ...current, hpp: value }))} type="number" min={0} step={1}/></div>
          <div className="grid gap-3 sm:grid-cols-2"><Input label="Satuan" value={draft.unit} onChange={(value) => setDraft((current) => ({ ...current, unit: value }))}/><Input label="Urutan tampil" value={draft.sortOrder} onChange={(value) => setDraft((current) => ({ ...current, sortOrder: value }))} type="number" min={0}/></div>
          <Input label="URL/path foto" value={draft.imagePath} onChange={(value) => setDraft((current) => ({ ...current, imagePath: value }))} placeholder="https://… atau /images/products/…"/>
          <Select label="Ketersediaan" value={draft.availability} onChange={(value) => setDraft((current) => ({ ...current, availability: value as ProductDraft['availability'] }))}><option value="AVAILABLE">Tersedia</option><option value="PRE_ORDER">Pre-order</option><option value="SOLD_OUT">Habis</option></Select>
          <label className="flex items-center gap-2 text-sm text-cocoa"><input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))}/> Tampilkan di katalog</label>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || categories.length === 0}><Save size={15}/>{saving ? 'Menyimpan…' : 'Simpan produk'}</Button>{editingId && <Button tone="secondary" onClick={() => { setEditingId(''); setDraft(emptyProduct); }}>Batal</Button>}</div>
        </form>
      </Panel>
    </div>
  </div>;
}

export function OwnerCategoriesPage() {
  const resource = useResource(listCategories);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function add(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try { await saveCategory({ name, sortOrder: (resource.data ?? []).length + 1, isActive: true }); setName(''); setMessage('Kategori berhasil ditambahkan.'); await resource.reload(); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setSaving(false); }
  }
  async function toggle(item: CategoryRecord) {
    try { await saveCategory({ name: item.name, sortOrder: item.sortOrder, isActive: !item.isActive }, item.id); setMessage('Status kategori diperbarui.'); await resource.reload(); }
    catch (reason) { setError(getErrorMessage(reason)); }
  }
  return <div><Heading kicker="Katalog & menu" title="Kategori" description="Atur pengelompokan produk dan kategori yang ditampilkan ke pelanggan."/><Feedback error={error || resource.error} success={message}/>
    <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
      <Panel title="Kategori baru"><form onSubmit={(event) => void add(event)} className="grid gap-3"><Input label="Nama kategori" value={name} onChange={setName} required/><Button type="submit" disabled={saving}><Plus size={15}/> Tambahkan kategori</Button></form></Panel>
      <Panel title="Daftar kategori">{resource.loading ? <Busy/> : !(resource.data ?? []).length ? <Empty>Belum ada kategori.</Empty> : <div className="space-y-2">{(resource.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-white p-3"><div><p className="font-semibold text-cocoa">{item.name}</p><p className="text-xs text-muted">Urutan {item.sortOrder} · {item.isActive ? 'Aktif' : 'Nonaktif'}</p></div><Button tone="secondary" onClick={() => void toggle(item)}>{item.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button></div>)}</div>}</Panel>
    </div>
  </div>;
}

export function OwnerProductionPage() {
  const products = useResource(listManagedProducts);
  const runs = useResource(listRecentProductionRuns);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { await recordProduction(productId, Number(quantity), note); setMessage('Produksi dicatat dan stok barang jadi diperbarui.'); setQuantity('1'); setNote(''); await Promise.all([runs.reload()]); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setBusy(false); }
  }
  const available = products.data ?? [];
  return <div><Heading kicker="Operasional" title="Produksi" description="Catat hasil produksi. Penambahan stok dan riwayat pergerakan diproses dalam transaksi server."/><Feedback error={error || products.error || runs.error} success={message}/>
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Panel title="Catat produksi"><form onSubmit={(event) => void submit(event)} className="grid gap-3"><Select label="Produk" value={productId} onChange={setProductId}><option value="">Pilih produk</option>{available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input label="Jumlah selesai" type="number" min={1} step={1} value={quantity} onChange={setQuantity} required/><Input label="Catatan" value={note} onChange={setNote} placeholder="Contoh: Produksi pagi"/><Button type="submit" disabled={busy || !productId}><Factory size={15}/>{busy ? 'Mencatat…' : 'Simpan hasil produksi'}</Button></form></Panel>
      <Panel title="Riwayat produksi">{runs.loading ? <Busy/> : !(runs.data ?? []).length ? <Empty>Belum ada produksi yang dicatat.</Empty> : <div className="space-y-2">{(runs.data ?? []).map((run) => <div key={run.id} className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-white p-3"><div><p className="font-semibold text-cocoa">{String(run.productName ?? run.productId ?? 'Produk')}</p><p className="text-xs text-muted">{safeDate(run.createdAt)} · {String(run.note ?? 'Produksi selesai')}</p></div><strong className="text-sm text-emerald-700">+{Number(run.quantity ?? 0)} {String(run.unit ?? 'pcs')}</strong></div>)}</div>}</Panel>
    </div>
  </div>;
}

export function OwnerInventoryPage() {
  const stock = useResource(listStock);
  const movements = useResource(listStockMovements);
  const [productId, setProductId] = useState('');
  const [delta, setDelta] = useState('1');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { await adjustFinishedStock(productId, Number(delta), reason); setMessage('Penyesuaian stok tercatat.'); setDelta('1'); setReason(''); await Promise.all([stock.reload(), movements.reload()]); }
    catch (reasonError) { setError(getErrorMessage(reasonError)); }
    finally { setBusy(false); }
  }
  return <div><Heading kicker="Operasional" title="Persediaan" description="Pantau stok barang jadi. Penyesuaian hanya berjalan melalui transaksi server dan menyimpan riwayat."/><Feedback error={error || stock.error || movements.error} success={message}/>
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Panel title="Saldo barang jadi">{stock.loading ? <Busy/> : !(stock.data ?? []).length ? <Empty>Belum ada produk terdaftar.</Empty> : <div className="space-y-2">{(stock.data ?? []).map((item) => <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-white p-3"><div><p className="font-semibold text-cocoa">{item.productName}</p><p className="text-xs text-muted">Pembaruan {safeDate(item.updatedAt)}</p></div><strong className="text-lg tabular-nums text-cocoa">{item.availableQty} <small className="text-xs text-muted">{item.unit}</small></strong></div>)}</div>}</Panel>
      <div className="grid gap-5"><Panel title="Penyesuaian stok"><form onSubmit={(event) => void submit(event)} className="grid gap-3"><Select label="Produk" value={productId} onChange={setProductId}><option value="">Pilih produk</option>{(stock.data ?? []).map((item) => <option key={item.productId} value={item.productId}>{item.productName}</option>)}</Select><Input label="Delta stok (+/-)" type="number" step={1} value={delta} onChange={setDelta} required/><Input label="Alasan" value={reason} onChange={setReason} required placeholder="Contoh: Koreksi stok fisik"/><Button type="submit" disabled={busy || !productId}>Simpan penyesuaian</Button></form></Panel>
        <Panel title="Riwayat pergerakan">{movements.loading ? <Busy/> : !(movements.data ?? []).length ? <Empty>Belum ada pergerakan stok.</Empty> : <div className="max-h-96 space-y-2 overflow-auto">{(movements.data ?? []).map((item) => <div key={item.id} className="flex justify-between gap-3 rounded-xl border border-stroke bg-white p-3 text-xs"><div><p className="font-semibold text-cocoa">{String(item.productName ?? item.productId ?? 'Produk')}</p><p className="mt-1 text-muted">{String(item.type ?? 'MOVEMENT')} · {safeDate(item.createdAt)}</p></div><strong className={Number(item.quantity) < 0 ? 'text-rose-700' : 'text-emerald-700'}>{Number(item.quantity) > 0 ? '+' : ''}{Number(item.quantity ?? 0)}</strong></div>)}</div>}</Panel>
      </div>
    </div>
  </div>;
}

export function OwnerDirectSalesPage() {
  const resource = useResource(listManagedProducts);
  const [lines, setLines] = useState<DirectSaleLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'QRIS'>('CASH');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ id: string; total: number } | null>(null);
  function setLine(id: string, quantity: number) {
    setLines((current) => {
      const filtered = current.filter((item) => item.productId !== id);
      return quantity > 0 ? [...filtered, { productId: id, quantity }] : filtered;
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setReceipt(null);
    try { const result = await createDirectSale(lines, paymentMethod, note); setReceipt(result); setLines([]); setNote(''); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setBusy(false); }
  }
  const products = (resource.data ?? []).filter((item) => !item.isArchived);
  return <div><Heading kicker="Penjualan" title="Penjualan langsung" description="Catat penjualan dari lapak atau kantin. Harga dihitung ulang oleh backend dan stok dipotong secara transaksional."/><Feedback error={error || resource.error} success={receipt ? 'Penjualan tersimpan · ' + receipt.id + ' · ' + formatRupiah(receipt.total) : ''}/>
    <Panel title="Input transaksi"><form onSubmit={(event) => void submit(event)} className="grid gap-4"><div className="grid gap-2 sm:grid-cols-2">{products.map((item) => {
      const quantity = lines.find((line) => line.productId === item.id)?.quantity ?? 0;
      return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-stroke bg-white p-3"><div className="min-w-0"><p className="font-semibold text-cocoa">{item.name}</p><p className="text-xs text-muted">{item.price == null ? 'Harga belum ditetapkan' : formatRupiah(item.price)}</p></div><input aria-label={'Jumlah ' + item.name} type="number" min={0} max={50} value={quantity} onChange={(event) => setLine(item.id, Number(event.target.value))} className="h-10 w-20 rounded-lg border border-stroke px-2 text-center text-sm"/></div>;
    })}</div><div className="grid gap-3 sm:grid-cols-2"><Select label="Metode pembayaran" value={paymentMethod} onChange={(value) => setPaymentMethod(value as typeof paymentMethod)}><option value="CASH">Tunai</option><option value="BANK_TRANSFER">Transfer bank</option><option value="QRIS">QRIS</option></Select><Input label="Catatan" value={note} onChange={setNote}/></div><p className="text-xs text-muted">{lines.reduce((sum, line) => sum + line.quantity, 0)} item · nilai final dihitung server.</p><Button type="submit" disabled={busy || !lines.length}>{busy ? 'Menyimpan…' : 'Simpan penjualan'}</Button></form></Panel>
  </div>;
}

export function OwnerReportsPage() {
  const resource = useResource(getVerifiedSalesSummary);
  const online = resource.data?.onlineRevenue ?? 0;
  const direct = resource.data?.directRevenue ?? 0;
  const cards = [
    { title: 'Pendapatan pesanan online terverifikasi', value: online },
    { title: 'Pendapatan penjualan langsung', value: direct },
    { title: 'Total pendapatan terverifikasi', value: online + direct },
  ];
  return <div><Heading kicker="Analitik usaha" title="Laporan" description="Ringkasan hanya menjumlah transaksi yang telah terverifikasi, bukan pesanan yang belum dibayar." action={<Button tone="secondary" onClick={() => void resource.reload()}><RefreshCw size={14}/> Perbarui</Button>}/><Feedback error={resource.error}/>
    {resource.loading ? <Busy/> : <><div className="grid gap-3 md:grid-cols-3">{cards.map((card) => <article key={card.title} className="owner-metric-card rounded-2xl border border-stroke bg-white p-5"><p className="text-xs text-muted">{card.title}</p><p className="mt-3 font-serif text-2xl font-bold text-cocoa">{formatRupiah(card.value)}</p></article>)}</div><Panel title="Aktivitas keuangan"><div className="flex flex-wrap items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={20}/></span><div><p className="font-semibold text-cocoa">{resource.data?.verifiedTransactions ?? 0} transaksi terverifikasi</p><p className="text-xs text-muted">Angka bersumber dari koleksi pembayaran dan penjualan langsung yang statusnya VERIFIED.</p></div></div></Panel></>}
  </div>;
}

type SettingsDraft = {
  displayName: string; tagline: string; whatsappNumber: string; instagramHandle: string;
  paymentBankName: string; paymentAccountNumber: string; paymentAccountHolder: string;
  paymentEwalletName: string; paymentEwalletNumber: string; bankName: string;
  bankAccountNumber: string; bankAccountHolder: string; pickupAddress: string;
};
const emptySettings: SettingsDraft = {
  displayName: 'KudapKita', tagline: '', whatsappNumber: '', instagramHandle: '',
  paymentBankName: '', paymentAccountNumber: '', paymentAccountHolder: '',
  paymentEwalletName: '', paymentEwalletNumber: '', bankName: '',
  bankAccountNumber: '', bankAccountHolder: '', pickupAddress: '',
};
export function OwnerSettingsPage() {
  const resource = useResource(getStoreSettings);
  const [draft, setDraft] = useState<SettingsDraft>(emptySettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!resource.data) return;
    setDraft({ ...emptySettings, ...resource.data.publicSettings, ...resource.data.privateSettings });
  }, [resource.data]);
  function set<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    try {
      await saveStoreSettings({
        displayName: draft.displayName, tagline: draft.tagline, whatsappNumber: draft.whatsappNumber,
        instagramHandle: draft.instagramHandle, paymentBankName: draft.paymentBankName,
        paymentAccountNumber: draft.paymentAccountNumber, paymentAccountHolder: draft.paymentAccountHolder,
        paymentEwalletName: draft.paymentEwalletName, paymentEwalletNumber: draft.paymentEwalletNumber,
      }, {
        bankName: draft.bankName, bankAccountNumber: draft.bankAccountNumber,
        bankAccountHolder: draft.bankAccountHolder, pickupAddress: draft.pickupAddress,
      });
      setMessage('Pengaturan bisnis tersimpan.');
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setSaving(false); }
  }
  return <div><Heading kicker="Konfigurasi bisnis" title="Pengaturan" description="Informasi publik toko dipisahkan dari rekening dan catatan internal yang hanya boleh dibaca owner."/><Feedback error={error || resource.error} success={message}/>
    <form onSubmit={(event) => void submit(event)} className="grid gap-5 xl:grid-cols-2">
      <Panel title="Informasi toko & kontak"><div className="grid gap-3"><Input label="Nama toko" value={draft.displayName} onChange={(value) => set('displayName', value)} required/><Input label="Tagline" value={draft.tagline} onChange={(value) => set('tagline', value)}/><Input label="WhatsApp (angka)" value={draft.whatsappNumber} onChange={(value) => set('whatsappNumber', value)} required/><Input label="Instagram" value={draft.instagramHandle} onChange={(value) => set('instagramHandle', value)}/></div></Panel>
      <Panel title="Informasi pembayaran publik"><div className="grid gap-3"><Input label="Nama bank" value={draft.paymentBankName} onChange={(value) => set('paymentBankName', value)}/><Input label="Nomor rekening untuk pelanggan" value={draft.paymentAccountNumber} onChange={(value) => set('paymentAccountNumber', value)}/><Input label="Atas nama" value={draft.paymentAccountHolder} onChange={(value) => set('paymentAccountHolder', value)}/><Input label="E-wallet" value={draft.paymentEwalletName} onChange={(value) => set('paymentEwalletName', value)}/><Input label="Nomor e-wallet" value={draft.paymentEwalletNumber} onChange={(value) => set('paymentEwalletNumber', value)}/></div></Panel>
      <Panel title="Data internal owner"><div className="grid gap-3"><Input label="Nama bank internal" value={draft.bankName} onChange={(value) => set('bankName', value)}/><Input label="Rekening internal" value={draft.bankAccountNumber} onChange={(value) => set('bankAccountNumber', value)}/><Input label="Nama pemilik rekening" value={draft.bankAccountHolder} onChange={(value) => set('bankAccountHolder', value)}/><Input label="Alamat titik pengambilan" value={draft.pickupAddress} onChange={(value) => set('pickupAddress', value)}/></div></Panel>
      <div className="flex items-end"><Button type="submit" disabled={saving || resource.loading}><Settings size={15}/>{saving ? 'Menyimpan…' : 'Simpan pengaturan'}</Button></div>
    </form>
  </div>;
}
