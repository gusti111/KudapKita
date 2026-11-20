import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/app/providers/CartProvider';
import { formatRupiah } from '@/shared/utils/format';
import { PrimaryButton } from '@/shared/components/ui/PrimaryButton';
import { ProductImage } from '@/shared/components/ui/ProductImage';

export function CartPage() {
  const { lines, subtotalEstimate, setQuantity, removeItem } = useCart();
  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <span className="eyebrow">Pilihanmu</span><h1 className="mt-2 font-serif text-4xl font-bold text-cocoa">Keranjang belanja.</h1>
    <p className="mt-2 text-sm text-muted">Atur jumlah camilan sebelum mengirim permintaan pesanan.</p>
    {lines.length === 0 ? <div className="cart-empty mt-8 rounded-3xl border border-dashed border-stroke bg-white p-10 text-center sm:p-14"><div className="text-5xl">🧺</div><h2 className="mt-4 font-serif text-2xl font-bold text-cocoa">Keranjangmu masih kosong.</h2><p className="mt-2 text-sm leading-6 text-muted">Ada camilan yang menunggu untuk kamu pilih.</p><Link to="/menu" className="mt-5 inline-flex"><PrimaryButton>Lihat katalog</PrimaryButton></Link></div> :
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">{lines.map((line) => <article key={line.productId} className="cart-line-card flex min-w-0 items-center gap-3 rounded-2xl border border-stroke bg-white p-3 sm:gap-4 sm:p-4">
          <ProductImage name={line.productName} category={line.categoryName} src={line.imagePath} className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24" />
          <div className="min-w-0 flex-1"><div className="truncate font-semibold text-cocoa">{line.productName}</div><div className="mt-1 text-xs text-muted">{formatRupiah(line.displayedUnitPrice)}</div>
            <div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => setQuantity(line.productId, line.quantity - 1)} className="quantity-step" aria-label={`Kurangi ${line.productName}`}><Minus size={13}/></button><span className="min-w-6 text-center text-sm font-semibold tabular-nums">{line.quantity}</span><button type="button" onClick={() => setQuantity(line.productId, line.quantity + 1)} className="quantity-step" aria-label={`Tambah ${line.productName}`}><Plus size={13}/></button><span className="ml-1 text-[10px] text-muted">Maks. 50</span></div>
          </div><button type="button" onClick={() => removeItem(line.productId)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-rose-50 hover:text-rose-700" aria-label={`Hapus ${line.productName}`}><Trash2 size={16}/></button>
        </article>)}</div>
        <aside className="cart-summary-card sticky top-24 h-fit rounded-2xl border border-stroke bg-white p-5 sm:p-6"><span className="eyebrow">Ringkasan pesanan</span><h2 className="mt-2 font-serif text-2xl font-bold text-cocoa">Satu langkah lagi.</h2><div className="mt-5 flex justify-between text-sm text-muted"><span>Jumlah item</span><strong className="text-cocoa">{lines.reduce((sum, line) => sum + line.quantity, 0)} pcs</strong></div><div className="mt-3 flex justify-between gap-3 border-t border-stroke pt-4 text-sm"><span className="text-muted">Estimasi subtotal</span><strong className="text-lg text-cocoa">{formatRupiah(subtotalEstimate)}</strong></div><p className="mt-4 rounded-xl bg-cream p-3 text-xs leading-5 text-muted">Harga final, ongkir, dan ketersediaan akan diperiksa admin. Angka ini belum menjadi tagihan.</p><Link to="/checkout" className="mt-5 block"><PrimaryButton className="w-full">Lanjut ke checkout</PrimaryButton></Link><Link to="/menu" className="mt-3 block text-center text-xs font-semibold text-terracotta">Tambah camilan lainnya</Link></aside>
      </div>}
  </section>;
}
