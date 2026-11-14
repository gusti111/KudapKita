import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/app/providers/CartProvider';
import { createGuestOrder } from '@/data/repositories/orders.repository';
import { validateOrderRequest } from '@/domain/rules/order-rules';
import { buildWhatsAppUrl } from '@/shared/utils/format';
import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';
import { Notice } from '@/shared/components/feedback/Notice';
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuth } from '@/app/providers/AuthProvider';

export function CheckoutPage() {
  const { lines, clearCart } = useCart();
  const { loading: authLoading, firebaseReady } = useAuth();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [method, setMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const payload = { customerName: name, customerWhatsApp: whatsapp, fulfillmentMethod: method, deliveryAddress: address, customerNote: note, items: lines };
    const validation = validateOrderRequest(payload);
    if (validation) { setError(validation); return; }
    setSubmitting(true);
    try {
      const id = await createGuestOrder(payload);
      setCreatedId(id);
      clearCart();
      const text = `Halo KudapKita, saya mengirim permintaan pesanan ${id}. Nama: ${name}. Mohon konfirmasi ketersediaan, total akhir, dan instruksi pembayaran.`;
      const waUrl = buildWhatsAppUrl(import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER ?? '', text);
      setWhatsAppUrl(waUrl);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Pesanan belum berhasil disimpan.'));
    } finally { setSubmitting(false); }
  }

  if (createdId) return <section className="mx-auto max-w-xl px-4 py-16 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-700"><CheckCircle2 size={32}/></div><h1 className="mt-5 font-serif text-3xl font-bold text-cocoa">Permintaan terkirim</h1><p className="mt-2 text-sm leading-6 text-muted">Simpan kode permintaan ini. Admin perlu memeriksa stok dan mengonfirmasi total sebelum pembayaran.</p><div className="mt-5 rounded-xl bg-white p-4 text-left"><div className="text-xs text-muted">Kode permintaan</div><div className="mt-1 break-all font-mono text-sm font-bold text-cocoa">{createdId}</div></div><Link to={`/pesanan/${createdId}`} className="mt-5 inline-block text-sm font-semibold text-terracotta">Lihat status pesanan →</Link>{whatsAppUrl ? <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#217A50] px-5 text-sm font-semibold text-white">Lanjutkan ke WhatsApp</a> : <p className="mt-4 text-xs text-muted">Nomor WhatsApp belum dikonfigurasi. Hubungi admin dan sertakan kode di atas.</p>}</section>;

  return <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><Link to="/keranjang" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-cocoa"><ArrowLeft size={16}/> Kembali ke keranjang</Link><h1 className="mt-5 font-serif text-4xl font-bold text-cocoa">Checkout</h1><p className="mt-2 text-sm text-muted">Isi informasi agar admin dapat memeriksa dan mengonfirmasi permintaanmu.</p>{!firebaseReady && <div className="mt-5"><Notice tone="warning">Firebase belum dikonfigurasi. Checkout belum dapat menyimpan pesanan pada mode demo.</Notice></div>}{lines.length === 0 ? <div className="mt-6"><Notice tone="warning">Keranjang kosong. Tambahkan produk sebelum checkout.</Notice><Link to="/menu" className="mt-4 inline-block text-sm font-semibold text-terracotta">Kembali ke katalog →</Link></div> : <form onSubmit={handleSubmit} className="mt-7 grid gap-6 rounded-2xl border border-stroke bg-white p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-cocoa">Nama lengkap<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-xl border border-stroke px-3 font-normal outline-none focus:border-terracotta" placeholder="Nama penerima"/></label><label className="grid gap-2 text-sm font-semibold text-cocoa">Nomor WhatsApp<input required value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="h-11 rounded-xl border border-stroke px-3 font-normal outline-none focus:border-terracotta" placeholder="08xxxxxxxxxx" inputMode="tel"/></label></div><fieldset><legend className="mb-3 text-sm font-semibold text-cocoa">Metode penerimaan</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-xl border p-4 text-sm ${method === 'PICKUP' ? 'border-terracotta bg-orange-50' : 'border-stroke'}`}><input type="radio" name="fulfillment" checked={method === 'PICKUP'} onChange={() => setMethod('PICKUP')} className="mr-2 accent-terracotta"/>Ambil sendiri</label><label className={`cursor-pointer rounded-xl border p-4 text-sm ${method === 'DELIVERY' ? 'border-terracotta bg-orange-50' : 'border-stroke'}`}><input type="radio" name="fulfillment" checked={method === 'DELIVERY'} onChange={() => setMethod('DELIVERY')} className="mr-2 accent-terracotta"/>Pengantaran</label></div></fieldset>{method === 'DELIVERY' && <label className="grid gap-2 text-sm font-semibold text-cocoa">Alamat pengantaran<textarea required value={address} onChange={(event) => setAddress(event.target.value)} rows={3} className="rounded-xl border border-stroke p-3 font-normal outline-none focus:border-terracotta" placeholder="Alamat lengkap dan patokan"/></label>}<label className="grid gap-2 text-sm font-semibold text-cocoa">Catatan tambahan <span className="font-normal text-muted">(opsional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-xl border border-stroke p-3 font-normal outline-none focus:border-terracotta" placeholder="Contoh: kebutuhan acara atau preferensi pengambilan"/></label>{error && <Notice tone="error">{error}</Notice>}<Notice tone="info">Ini adalah permintaan pesanan, bukan konfirmasi tagihan. Admin akan memeriksa ketersediaan dan memberi total akhir melalui WhatsApp.</Notice><PrimaryButton type="submit" disabled={submitting || authLoading || !firebaseReady}>{submitting ? 'Mengirim permintaan…' : 'Kirim permintaan pesanan'}</PrimaryButton></form>}</section>;
}
