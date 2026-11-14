import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Archive, Check, Plus, RefreshCw, Save, Settings, ShoppingCart } from 'lucide-react';
import { LoadingScreen } from '@/shared/components/feedback/LoadingScreen';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { Notice } from '@/shared/components/feedback/Notice';
import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';
import { formatRupiah } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/errors';
import {
  adjustFinishedStock,
  archiveManagedProduct,
  createDirectSale,
  getStoreSettings,
  getVerifiedSalesSummary,
  listCategories,
  listManagedProducts,
  listRecentProductionRuns,
  listStock,
  listStockMovements,
  recordProduction,
  saveCategory,
  saveManagedProduct,
  saveStoreSettings,
  type CategoryRecord,
  type ManagedProduct,
  type ProductInput,
  type StockRecord,
} from '@/data/repositories/owner-operations.repository';

function PageHeading({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description: string; action?: ReactNode;
}) {
  return <div className="flex flex-wrap items-end justify-between gap-4">
    <div><span className="text-xs font-bold uppercase tracking-[.18em] text-terracotta">{eyebrow}</span><h1 className="mt-2 font-serif text-3xl font-bold text-cocoa">{title}</h1><p className="mt-1 text-sm text-muted">{description}</p></div>
    {action}
  </div>;
}
function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-stroke bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="font-semibold text-cocoa">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}</div>{children}</section>;
}
function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, min, step, help }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; min?: number; step?: number; help?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <label htmlFor={id} className="grid gap-1.5 text-xs font-semibold text-cocoa">{label}
    <input id={id} type={type} value={value} required={required} min={min} step={step} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-stroke bg-white px-3 text-sm font-normal text-ink outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/10"/>
    {help && <span className="font-normal leading-5 text-muted">{help}</span>}
  </label>;
}
function ErrorNotice({ error }: { error: string }) { return error ? <div className="mb-5"><Notice tone="error">{error}</Notice></div> : null; }
function Empty({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-dashed border-stroke bg-cream/50 p-8 text-center text-sm text-muted">{children}</div>; }
function money(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? formatRupiah(value) : '—'; }
function dateText(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value.toDate() as Date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return 'Waktu tidak tersedia';
}
function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

type ProductDraft = { name: string; slug: string; shortDescription: string; categoryId: string; categoryName: string; price: string; hpp: string; unit: string; imagePath: string; availability: ManagedProduct['availability']; isPublished: boolean; sortOrder: string; };
const blankProduct: ProductDraft = {
  name: '', slug: '', shortDescription: '', categoryId: '', categoryName: '',
  price: '', hpp: '', unit: 'pcs', imagePath: '', availability: 'AVAILABLE' as const,
  isPublished: true, sortOrder: '0',
};

export function OwnerProductsPage() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(blankProduct);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingArchive, setPendingArchive] = useState<ManagedProduct | null>(null);
  const [archiving, setArchiving] = useState(false);

  async function reload() {
    setLoading(true); setError('');
    try {
      const [nextProducts, nextCategories] = await Promise.all([listManagedProducts(), listCategories()]);
      setProducts(nextProducts); setCategories(nextCategories.filter((item) => item.isActive));
    } catch (loadError) { setError(getErrorMessage(loadError, 'Data produk gagal dimuat.')); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);

  function reset() { setDraft(blankProduct); setEditingId(''); setSuccess(''); }
  function edit(product: ManagedProduct) {
    setEditingId(product.id);
    setDraft({
      name: product.name, slug: product.slug, shortDescription: product.shortDescription,
      categoryId: product.categoryId, categoryName: product.categoryName,
      price: product.price === null ? '' : String(product.price),
      hpp: product.hpp == null ? '' : String(product.hpp),
      unit: product.unit || 'pcs', imagePath: product.imagePath || '',
      availability: product.availability, isPublished: product.isPublished,
      sortOrder: String(product.sortOrder ?? 0),
    });
    setSuccess('');
  }
  function set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const selectedCategory = categories.find((item) => item.id === draft.categoryId);
      const input: ProductInput = {
        name: draft.name, slug: draft.slug || slugify(draft.name),
        shortDescription: draft.shortDescription,
        categoryId: draft.categoryId, categoryName: selectedCategory?.name ?? draft.categoryName,
        price: draft.price.trim() === '' ? null : Number(draft.price),
        hpp: draft.hpp.trim() === '' ? null : Number(draft.hpp),
        unit: draft.unit, imagePath: draft.imagePath,
        availability: draft.availability, isPublished: draft.isPublished,
        isArchived: false, sortOrder: Number(draft.sortOrder),
      };
      await saveManagedProduct(input, editingId || undefined);
      setSuccess(editingId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
      reset(); await reload();
    } catch (saveError) { setError(getErrorMessage(saveError, 'Produk gagal disimpan.')); }
    finally { setSaving(false); }
  }
  async function confirmArchive() {
    if (!pendingArchive) return;
    setArchiving(true); setError(''); setSuccess('');
    try {
      await archiveManagedProduct(pendingArchive.id);
      setSuccess(`Produk “${pendingArchive.name}” berhasil diarsipkan.`);
      setPendingArchive(null);
      await reload();
    } catch (archiveError) { setError(getErrorMessage(archiveError)); }
    finally { setArchiving(false); }
  }

  return <div>
    <PageHeading eyebrow="Katalog" title="Produk" description="Kelola katalog publik dan informasi internal produk, termasuk HPP." action={<PrimaryButton tone="secondary" onClick={() => void reload()}><RefreshCw size={15}/> Muat ulang</PrimaryButton>}/>
    <ErrorNotice error={error}/>
    {success && <div className="mt-5"><Notice tone="success">{success}</Notice></div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Panel title="Daftar produk" description="Produk yang diarsipkan tidak ditampilkan di daftar aktif.">
        {loading ? <LoadingScreen label="Memuat produk…"/> : products.length === 0 ? <Empty>Belum ada produk. Tambahkan produk pertama melalui formulir.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-stroke text-xs text-muted"><th className="pb-3 pr-3">Produk</th><th className="pb-3 pr-3">Harga</th><th className="pb-3 pr-3">Ketersediaan</th><th className="pb-3 pr-3">Publik</th><th className="pb-3">Aksi</th></tr></thead><tbody className="divide-y divide-stroke">{products.map((product) => <tr key={product.id}><td className="py-3 pr-3"><div className="font-semibold text-cocoa">{product.name}</div><div className="text-xs text-muted">{product.categoryName} · {product.unit}</div></td><td className="py-3 pr-3 text-xs">{money(product.price)}</td><td className="py-3 pr-3 text-xs">{product.availability === 'AVAILABLE' ? 'Tersedia' : product.availability === 'PRE_ORDER' ? 'Pre-order' : 'Habis'}</td><td className="py-3 pr-3"><span className={product.isPublished ? 'text-green-700' : 'text-muted'}>{product.isPublished ? 'Tayang' : 'Disembunyikan'}</span></td><td className="py-3"><div className="flex gap-2"><button onClick={() => edit(product)} className="rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-cocoa hover:bg-cream">Edit</button><button onClick={() => setPendingArchive(product)} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-700" aria-label={`Arsipkan ${product.name}`}><Archive size={15}/></button></div></td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title={editingId ? 'Edit produk' : 'Tambah produk'} description="Harga dan HPP diisi sesuai catatan usaha. HPP hanya disimpan di koleksi privat.">
        <form onSubmit={(event) => void submit(event)} className="grid gap-4">
          <Field label="Nama produk" value={draft.name} onChange={(value) => { set('name', value); if (!editingId) set('slug', slugify(value)); }} required placeholder="Contoh: Risol kentang bengkuang"/>
          <Field label="Slug URL" value={draft.slug} onChange={(value) => set('slug', value)} required placeholder="risol-kentang-bengkuang"/>
          <label className="grid gap-1.5 text-xs font-semibold text-cocoa">Kategori
            <select required value={draft.categoryId} onChange={(event) => { const found = categories.find((item) => item.id === event.target.value); setDraft((current) => ({ ...current, categoryId: event.target.value, categoryName: found?.name ?? '' })); }} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal">
              <option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {categories.length === 0 && <span className="font-normal text-muted">Buat kategori terlebih dahulu di menu Kategori.</span>}
          </label>
          <Field label="Deskripsi singkat" value={draft.shortDescription} onChange={(value) => set('shortDescription', value)} placeholder="Deskripsi yang tampil di katalog"/>
          <div className="grid grid-cols-2 gap-3"><Field label="Harga jual (Rp)" type="number" min={0} step={1} value={draft.price} onChange={(value) => set('price', value)} placeholder="Kosong = belum ditetapkan"/><Field label="HPP (Rp)" type="number" min={0} step={1} value={draft.hpp} onChange={(value) => set('hpp', value)} placeholder="Rahasia internal"/></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Satuan" value={draft.unit} onChange={(value) => set('unit', value)} required placeholder="pcs / paket"/><Field label="Urutan tampil" type="number" min={0} value={draft.sortOrder} onChange={(value) => set('sortOrder', value)}/></div>
          <Field label="Path foto statis" value={draft.imagePath} onChange={(value) => set('imagePath', value)} placeholder="/images/products/risol-mayo.jpg" help="Letakkan berkas foto di apps/web/public/images/products/. Tidak ada upload Firebase Storage pada MVP."/>
          <label className="grid gap-1.5 text-xs font-semibold text-cocoa">Ketersediaan
            <select value={draft.availability} onChange={(event) => set('availability', event.target.value as ProductDraft['availability'])} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal"><option value="AVAILABLE">Tersedia</option><option value="PRE_ORDER">Pre-order</option><option value="SOLD_OUT">Habis</option></select>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-cocoa"><input type="checkbox" checked={draft.isPublished} onChange={(event) => set('isPublished', event.target.checked)} className="h-4 w-4 accent-terracotta"/> Tampilkan di katalog publik</label>
          <div className="flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={saving || categories.length === 0}>{saving ? 'Menyimpan…' : <><Save size={15}/> {editingId ? 'Simpan perubahan' : 'Tambah produk'}</>}</PrimaryButton>{editingId && <PrimaryButton type="button" tone="secondary" onClick={reset}>Batal edit</PrimaryButton>}</div>
        </form>
      </Panel>
    </div>
    <ConfirmDialog
      open={Boolean(pendingArchive)}
      title="Arsipkan produk?"
      description={pendingArchive ? `“${pendingArchive.name}” akan disembunyikan dari katalog. Riwayat produk dan transaksi lama tetap dipertahankan.` : ''}
      confirmLabel="Arsipkan produk"
      busy={archiving}
      onCancel={() => setPendingArchive(null)}
      onConfirm={() => void confirmArchive()}
    />
  </div>;
}

export function OwnerCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { setCategories(await listCategories()); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { await saveCategory({ name, sortOrder: Number(sortOrder), isActive: true }); setName(''); setSortOrder(String(categories.length + 1)); setSuccess('Kategori berhasil dibuat.'); await reload(); }
    catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setBusy(false); }
  }
  return <div><PageHeading eyebrow="Katalog" title="Kategori produk" description="Kelompokkan camilan agar pelanggan lebih mudah menemukan menu."/><ErrorNotice error={error}/>{success && <div className="mt-5"><Notice tone="success">{success}</Notice></div>}<div className="mt-7 grid gap-6 md:grid-cols-[1fr_380px]"><Panel title="Daftar kategori">{loading ? <LoadingScreen/> : categories.length === 0 ? <Empty>Belum ada kategori.</Empty> : <div className="divide-y divide-stroke">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 py-3"><div><div className="text-sm font-semibold text-cocoa">{category.name}</div><div className="text-xs text-muted">Urutan {category.sortOrder}</div></div><span className={category.isActive ? 'text-xs font-semibold text-green-700' : 'text-xs text-muted'}>{category.isActive ? 'Aktif' : 'Nonaktif'}</span></div>)}</div>}</Panel><Panel title="Tambah kategori"><form onSubmit={(event) => void submit(event)} className="grid gap-4"><Field label="Nama kategori" value={name} onChange={setName} required placeholder="Contoh: Camilan gurih"/><Field label="Urutan tampil" type="number" min={0} value={sortOrder} onChange={setSortOrder}/><PrimaryButton type="submit" disabled={busy}>{busy ? 'Menyimpan…' : <><Plus size={15}/> Tambah kategori</>}</PrimaryButton></form></Panel></div></div>;
}

export function OwnerProductionPage() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [runs, setRuns] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { const [p, r] = await Promise.all([listManagedProducts(), listRecentProductionRuns()]); setProducts(p); setRuns(r); if (!productId && p[0]) setProductId(p[0].id); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { await recordProduction(productId, Number(quantity), note); setSuccess('Hasil produksi berhasil dicatat dan ditambahkan ke stok siap jual.'); setQuantity('1'); setNote(''); await reload(); }
    catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setBusy(false); }
  }
  return <div><PageHeading eyebrow="Operasional" title="Produksi" description="Catat hasil produksi selesai. Pencatatan produksi menambah stok produk jadi."/><ErrorNotice error={error}/>{success && <div className="mt-5"><Notice tone="success">{success}</Notice></div>}<div className="mt-7 grid gap-6 lg:grid-cols-[380px_1fr]"><Panel title="Catat hasil produksi"><form onSubmit={(event) => void submit(event)} className="grid gap-4"><label className="grid gap-1.5 text-xs font-semibold text-cocoa">Produk<select required value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal"><option value="">Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><Field label="Jumlah hasil" type="number" min={1} step={1} value={quantity} onChange={setQuantity} required/><Field label="Catatan produksi" value={note} onChange={setNote} placeholder="Contoh: produksi pagi / batch 1"/><Notice tone="info">Stok bertambah setelah hasil produksi benar-benar selesai dan siap dijual. Proses ini mencatat saldo serta riwayat pergerakan secara atomik.</Notice><PrimaryButton type="submit" disabled={busy || loading || !productId}>{busy ? 'Mencatat…' : <><Check size={15}/> Simpan hasil produksi</>}</PrimaryButton></form></Panel><Panel title="Riwayat produksi terakhir">{loading ? <LoadingScreen/> : runs.length === 0 ? <Empty>Belum ada hasil produksi yang dicatat.</Empty> : <div className="space-y-3">{runs.map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stroke p-4"><div><div className="text-sm font-semibold text-cocoa">{String(run.productName ?? 'Produk')}</div><div className="mt-1 text-xs text-muted">{dateText(run.createdAt)} · {String(run.note ?? 'Tanpa catatan')}</div></div><div className="font-semibold text-green-700">+{String(run.quantity ?? 0)} {String(run.unit ?? 'pcs')}</div></div>)}</div>}</Panel></div></div>;
}

export function OwnerInventoryPage() {
  const [stock, setStock] = useState<StockRecord[]>([]);
  const [movements, setMovements] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [productId, setProductId] = useState('');
  const [delta, setDelta] = useState('1');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { const [s, m] = await Promise.all([listStock(), listStockMovements()]); setStock(s); setMovements(m); if (!productId && s[0]) setProductId(s[0].productId); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { await adjustFinishedStock(productId, Number(delta), reason); setSuccess('Penyesuaian stok berhasil dicatat.'); setReason(''); await reload(); }
    catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setBusy(false); }
  }
  return <div><PageHeading eyebrow="Inventori" title="Persediaan produk jadi" description="Saldo stok siap jual dan riwayat masuk/keluar. Stok bahan baku tidak dicampur dengan produk jadi." action={<PrimaryButton tone="secondary" onClick={() => void reload()}><RefreshCw size={15}/> Muat ulang</PrimaryButton>}/><ErrorNotice error={error}/>{success && <div className="mt-5"><Notice tone="success">{success}</Notice></div>}<div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]"><Panel title="Saldo stok siap jual">{loading ? <LoadingScreen/> : stock.length === 0 ? <Empty>Tambahkan produk terlebih dahulu untuk mulai mencatat stok.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b border-stroke text-xs text-muted"><th className="pb-3">Produk</th><th className="pb-3">Stok siap jual</th><th className="pb-3">Satuan</th><th className="pb-3">Kondisi</th></tr></thead><tbody className="divide-y divide-stroke">{stock.map((item) => <tr key={item.productId}><td className="py-3 font-semibold text-cocoa">{item.productName}</td><td className="py-3 tabular-nums">{item.availableQty}</td><td className="py-3 text-muted">{item.unit}</td><td className="py-3"><span className={item.availableQty > 0 ? 'text-xs font-semibold text-green-700' : 'text-xs font-semibold text-amber-700'}>{item.availableQty > 0 ? 'Ada stok' : 'Stok kosong'}</span></td></tr>)}</tbody></table></div>}</Panel><Panel title="Penyesuaian stok" description="Gunakan angka positif untuk menambah, negatif untuk mengurangi. Hasil produksi dicatat melalui menu Produksi."><form onSubmit={(event) => void submit(event)} className="grid gap-4"><label className="grid gap-1.5 text-xs font-semibold text-cocoa">Produk<select required value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal"><option value="">Pilih produk</option>{stock.map((item) => <option key={item.productId} value={item.productId}>{item.productName}</option>)}</select></label><Field label="Perubahan kuantitas (+ / -)" type="number" step={1} value={delta} onChange={setDelta} required/><Field label="Alasan penyesuaian" value={reason} onChange={setReason} required placeholder="Contoh: stok rusak / koreksi hitung"/><PrimaryButton type="submit" disabled={busy || loading || !productId}>{busy ? 'Menyimpan…' : 'Simpan penyesuaian'}</PrimaryButton></form></Panel></div><div className="mt-6"><Panel title="Riwayat pergerakan stok" description="Riwayat bersifat append-only agar koreksi tetap dapat ditelusuri.">{loading ? <LoadingScreen/> : movements.length === 0 ? <Empty>Belum ada pergerakan stok.</Empty> : <div className="divide-y divide-stroke">{movements.map((movement) => <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><div className="font-semibold text-cocoa">{String(movement.productName ?? 'Produk')}</div><div className="mt-1 text-xs text-muted">{String(movement.type ?? 'Perubahan')} · {String(movement.reason ?? movement.referenceId ?? '—')} · {dateText(movement.createdAt)}</div></div><div className={Number(movement.quantity) < 0 ? 'font-semibold text-rose-700' : 'font-semibold text-green-700'}>{Number(movement.quantity) > 0 ? '+' : ''}{String(movement.quantity ?? 0)} {String(movement.unit ?? 'pcs')}</div></div>)}</div>}</Panel></div></div>;
}

export function OwnerDirectSalesPage() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'QRIS'>('CASH');
  const [note, setNote] = useState('');
  const [lastSale, setLastSale] = useState<{ id: string; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { const result = await listManagedProducts(); setProducts(result.filter((item) => item.price !== null && item.price > 0)); if (!productId && result[0]) setProductId(result.filter((item) => item.price !== null && item.price > 0)[0]?.id ?? ''); }
    catch (loadError) { setError(getErrorMessage(loadError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setLastSale(null);
    try { const result = await createDirectSale([{ productId, quantity: Number(quantity) }], paymentMethod, note); setLastSale(result); setQuantity('1'); setNote(''); }
    catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setBusy(false); }
  }
  const selected = products.find((item) => item.id === productId);
  const estimate = selected?.price ? selected.price * Number(quantity || 0) : null;
  return <div><PageHeading eyebrow="Penjualan" title="Penjualan langsung" description="Catat transaksi lapak dan kampus secara terpisah dari pesanan online."/><ErrorNotice error={error}/>{lastSale && <div className="mt-5"><Notice tone="success">Transaksi {lastSale.id} tersimpan. Total {formatRupiah(lastSale.total)} sudah masuk ke kanal penjualan langsung dan stok dikurangi.</Notice></div>}<div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"><Panel title="Transaksi baru" description="Menyimpan transaksi akan mengurangi stok secara atomik. Pastikan pembayaran sudah diterima sebelum mencatat.">{loading ? <LoadingScreen/> : products.length === 0 ? <Empty>Belum ada produk publik dengan harga yang ditetapkan. Lengkapi katalog terlebih dahulu.</Empty> : <form onSubmit={(event) => void submit(event)} className="grid max-w-xl gap-4"><label className="grid gap-1.5 text-xs font-semibold text-cocoa">Produk<select required value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal">{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatRupiah(product.price)}</option>)}</select></label><Field label="Jumlah" type="number" min={1} step={1} value={quantity} onChange={setQuantity} required/><label className="grid gap-1.5 text-xs font-semibold text-cocoa">Metode pembayaran<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} className="h-11 rounded-xl border border-stroke bg-white px-3 text-sm font-normal"><option value="CASH">Tunai</option><option value="BANK_TRANSFER">Transfer bank</option><option value="QRIS">QRIS</option></select></label><Field label="Catatan (opsional)" value={note} onChange={setNote} placeholder="Lokasi lapak / keterangan transaksi"/><div className="rounded-xl bg-cream p-4"><div className="text-xs text-muted">Estimasi total transaksi</div><div className="mt-1 text-2xl font-bold text-cocoa">{estimate === null || !Number.isFinite(estimate) ? '—' : formatRupiah(estimate)}</div><div className="mt-1 text-xs text-muted">Total dikunci dari harga katalog saat transaksi disimpan.</div></div><PrimaryButton type="submit" disabled={busy || !productId || Number(quantity) < 1}>{busy ? 'Menyimpan…' : <><ShoppingCart size={15}/> Simpan penjualan</>}</PrimaryButton></form>}</Panel><Panel title="Aturan pencatatan"><div className="space-y-4 text-sm leading-6 text-muted"><p><strong className="text-cocoa">Penjualan langsung</strong> menyimpan snapshot nama produk, harga jual, jumlah, dan total.</p><p><strong className="text-cocoa">Stok</strong> berkurang pada transaksi yang sama dengan pencatatan penjualan dan riwayat pergerakan.</p><p><strong className="text-cocoa">Laporan</strong> memisahkan kanal langsung dari pembayaran pesanan online.</p><p className="text-xs">MVP belum menyediakan refund otomatis atau pembatalan transaksi langsung. Periksa data sebelum menyimpan.</p></div></Panel></div></div>;
}

export function OwnerReportsPage() {
  const [summary, setSummary] = useState<{ onlineRevenue: number; directRevenue: number; verifiedTransactions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function reload() {
    setLoading(true); setError('');
    try { setSummary(await getVerifiedSalesSummary()); }
    catch (loadError) { setError(getErrorMessage(loadError, 'Laporan belum dapat dimuat.')); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  const total = (summary?.onlineRevenue ?? 0) + (summary?.directRevenue ?? 0);
  return <div><PageHeading eyebrow="Analitik" title="Laporan penjualan" description="Akumulasi pembayaran yang sudah diverifikasi, dipisahkan menurut kanal." action={<PrimaryButton tone="secondary" onClick={() => void reload()}><RefreshCw size={15}/> Muat ulang</PrimaryButton>}/><ErrorNotice error={error}/>{loading ? <LoadingScreen/> : !summary ? <Empty>Data laporan belum tersedia.</Empty> : <><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ReportCard title="Total terverifikasi" value={formatRupiah(total)} detail="Online + penjualan langsung"/><ReportCard title="Pesanan online" value={formatRupiah(summary.onlineRevenue)} detail="Pembayaran berstatus VERIFIED"/><ReportCard title="Penjualan langsung" value={formatRupiah(summary.directRevenue)} detail="Transaksi direct berstatus VERIFIED"/><ReportCard title="Jumlah transaksi" value={String(summary.verifiedTransactions)} detail="Transaksi terverifikasi"/></div><div className="mt-6"><Notice tone="info">Angka ini merupakan akumulasi seluruh dokumen terverifikasi yang tersedia, bukan laporan harian atau bulanan. Permintaan yang belum dibayar dan pembayaran yang belum diverifikasi tidak dihitung sebagai pendapatan.</Notice></div></>}</div>;
}
function ReportCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-stroke bg-white p-5"><div className="text-xs font-medium text-muted">{title}</div><div className="mt-4 break-words text-2xl font-bold text-cocoa">{value}</div><div className="mt-2 text-xs text-muted">{detail}</div></div>;
}

export function OwnerSettingsPage() {
  const [publicSettings, setPublicSettings] = useState({ displayName: 'KudapKita', tagline: '', whatsappNumber: '', instagramHandle: '' });
  const [privateSettings, setPrivateSettings] = useState({ bankName: '', bankAccountNumber: '', bankAccountHolder: '', pickupAddress: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    getStoreSettings().then(({ publicSettings: pub, privateSettings: priv }) => {
      setPublicSettings({
        displayName: String(pub.displayName ?? 'KudapKita'),
        tagline: String(pub.tagline ?? ''),
        whatsappNumber: String(pub.whatsappNumber ?? ''),
        instagramHandle: String(pub.instagramHandle ?? ''),
      });
      setPrivateSettings({
        bankName: String(priv.bankName ?? ''),
        bankAccountNumber: String(priv.bankAccountNumber ?? ''),
        bankAccountHolder: String(priv.bankAccountHolder ?? ''),
        pickupAddress: String(priv.pickupAddress ?? ''),
      });
    }).catch((loadError) => setError(getErrorMessage(loadError))).finally(() => setLoading(false));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try { await saveStoreSettings(publicSettings, privateSettings); setSuccess('Pengaturan toko berhasil disimpan.'); }
    catch (saveError) { setError(getErrorMessage(saveError)); }
    finally { setBusy(false); }
  }
  const updatePublic = (key: keyof typeof publicSettings, value: string) => setPublicSettings((current) => ({ ...current, [key]: value }));
  const updatePrivate = (key: keyof typeof privateSettings, value: string) => setPrivateSettings((current) => ({ ...current, [key]: value }));
  return <div><PageHeading eyebrow="Sistem" title="Pengaturan toko" description="Identitas publik, kontak pelanggan, rekening pembayaran, dan alamat pengambilan."/><ErrorNotice error={error}/>{success && <div className="mt-5"><Notice tone="success">{success}</Notice></div>}{loading ? <LoadingScreen/> : <form onSubmit={(event) => void submit(event)} className="mt-7 grid gap-6 xl:grid-cols-2"><Panel title="Informasi publik" description="Data yang dapat dibaca pelanggan pada katalog."><div className="grid gap-4"><Field label="Nama toko" value={publicSettings.displayName} onChange={(value) => updatePublic('displayName', value)} required/><Field label="Tagline" value={publicSettings.tagline} onChange={(value) => updatePublic('tagline', value)} placeholder="Camilan buat hari-hari"/><Field label="Nomor WhatsApp (kode negara + nomor)" value={publicSettings.whatsappNumber} onChange={(value) => updatePublic('whatsappNumber', value)} required placeholder="628xxxxxxxxxx"/><Field label="Instagram" value={publicSettings.instagramHandle} onChange={(value) => updatePublic('instagramHandle', value)} placeholder="@kudapkita"/></div></Panel><Panel title="Informasi privat" description="Hanya dapat dibaca oleh akun owner. Pastikan rekening dan alamat sudah benar."><div className="grid gap-4"><Field label="Nama bank / penyedia pembayaran" value={privateSettings.bankName} onChange={(value) => updatePrivate('bankName', value)} placeholder="Nama bank / QRIS"/><Field label="Nomor rekening" value={privateSettings.bankAccountNumber} onChange={(value) => updatePrivate('bankAccountNumber', value)} placeholder="Nomor rekening"/><Field label="Nama pemilik rekening" value={privateSettings.bankAccountHolder} onChange={(value) => updatePrivate('bankAccountHolder', value)} placeholder="Nama pemilik"/><Field label="Alamat pengambilan" value={privateSettings.pickupAddress} onChange={(value) => updatePrivate('pickupAddress', value)} placeholder="Alamat lengkap dan patokan"/></div></Panel><div className="xl:col-span-2"><Notice tone="warning">Nomor WhatsApp, identitas rekening, dan alamat masih harus dikonfirmasi langsung oleh pemilik usaha sebelum digunakan pelanggan. Data rekening disimpan di koleksi privat.</Notice><div className="mt-4"><PrimaryButton type="submit" disabled={busy}>{busy ? 'Menyimpan…' : <><Settings size={15}/> Simpan pengaturan</>}</PrimaryButton></div></div></form>}</div>;
}
