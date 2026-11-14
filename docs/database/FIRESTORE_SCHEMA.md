# Firestore Data Model — KudapKita MVP

Dokumen ini menjelaskan skema yang dipakai oleh alur implementasi. Data privat dan projection publik sengaja dipisahkan. Semua nilai harga/kuantitas perlu berasal dari catatan operasional usaha yang benar.

## Koleksi utama

| Koleksi | Akses | Tujuan |
|---|---|---|
| `userProfiles/{uid}` | Owner; user untuk dokumen dirinya | Profil owner, dibuat manual |
| `publicProducts/{productId}` | Publik hanya dokumen tayang; owner | Projection aman untuk katalog |
| `products/{productId}` | Owner | Data internal produk termasuk HPP |
| `publicCategories/{categoryId}` | Publik untuk kategori aktif; owner | Projection kategori |
| `categories/{categoryId}` | Owner | Pengelolaan kategori |
| `orders/{orderId}` | Owner; guest pemilik UID | Permintaan, status, dan snapshot item |
| `orderPrivate/{orderId}` | Owner | Catatan internal pesanan |
| `payments/{paymentId}` | Owner | Catatan verifikasi pembayaran |
| `inventory/{productId}` | Owner | Saldo stok produk jadi |
| `stockMovements/{movementId}` | Owner, append-only | Histori perubahan stok |
| `productionRuns/{runId}` | Owner, append-only | Catatan hasil produksi selesai |
| `directSales/{saleId}` | Owner, append-only | Penjualan lapak/kampus |
| `publicSettings/storefront` | Public get; owner write | Nama toko, tagline, WhatsApp, Instagram |
| `privateSettings/business` | Owner | Informasi rekening dan alamat pengambilan |
| `activityLogs/{logId}` | Owner, append-only | Log aktivitas best-effort |

## Product internal vs public projection

### `products/{productId}` — owner only

Memuat semua field publik ditambah nilai internal:

```ts
{
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  price: number | null;        // Rupiah per unit
  hpp: number | null;          // internal, tidak diproyeksikan
  unit: string;
  imagePath: string;           // path static asset
  availability: 'AVAILABLE' | 'SOLD_OUT' | 'PRE_ORDER';
  isPublished: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: serverTimestamp();
  updatedAt: serverTimestamp();
}
```

### `publicProducts/{productId}`

Hanya field aman: `name`, `slug`, `shortDescription`, `categoryId`, `categoryName`, `price`, `imagePath`, `availability`, `isPublished`, `sortOrder`, `updatedAt`. HPP, resep, supplier, catatan internal, dan data stok internal tidak boleh dipublikasikan.

## Order dan lifecycle

### Initial guest create — `orders/{orderId}`

```ts
{
  createdByUid: string;
  customerName: string;
  customerWhatsApp: string;
  fulfillmentMethod: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  customerNote?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    displayedUnitPrice?: number; // display snapshot, bukan sumber tagihan
  }>;
  orderStatus: 'REQUESTED';
  paymentStatus: 'UNPAID';
  source: 'ONLINE';
  createdAt: serverTimestamp();
}
```

Owner menambahkan `confirmedTotal`, `quoteConfirmedAt`, lalu status pesanan berubah menjadi `WAITING_PAYMENT`. Verifikasi manual memperbarui `paymentStatus: 'PAID'`, `paymentMethod`, `paymentVerifiedAt`. Perubahan status selanjutnya dibatasi oleh state transition pada Rules.

Status pesanan:
- `REQUESTED`
- `WAITING_PAYMENT`
- `PREPARING`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`

Status pembayaran terpisah:
- `UNPAID`
- `WAITING_VERIFICATION` (disiapkan untuk perluasan proses manual)
- `PAID`
- `REJECTED`
- `REFUNDED` (belum menjadi alur refund otomatis)

### `payments/{paymentId}`

```ts
{
  orderId: string;
  amount: number;
  method: 'BANK_TRANSFER' | 'QRIS';
  status: 'VERIFIED';
  verifiedByUid: string;
  verifiedAt: serverTimestamp();
}
```

## Produk jadi, produksi, dan pergerakan stok

### `inventory/{productId}`

```ts
{
  productId: string;
  productName: string;
  availableQty: number; // unit produk jadi yang siap dijual
  unit: string;
  updatedAt: serverTimestamp();
}
```

### `stockMovements/{movementId}`

```ts
{
  productId: string;
  productName: string;
  type: 'PRODUCTION' | 'ADJUSTMENT' | 'DIRECT_SALE' | 'ONLINE_ORDER';
  quantity: number; // positif masuk, negatif keluar
  beforeQty: number;
  afterQty: number;
  referenceId?: string;
  reason?: string;
  createdAt: serverTimestamp();
}
```

### `productionRuns/{runId}`

```ts
{
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  note?: string;
  status: 'COMPLETED';
  stockMovementId: string;
  createdAt: serverTimestamp();
}
```

Produksi yang selesai menambah stok dan menulis production run serta stock movement dalam satu transaksi. Penjualan langsung dan mulai persiapan pesanan online mengurangi stok serta menulis movement dalam transaksi Firestore.

> Model ini mencatat stok produk jadi yang dapat dijual. Model stok bahan baku/resep seperti pada Dapur Bunda belum diterapkan pada KudapKita.

## Penjualan langsung

### `directSales/{saleId}`

```ts
{
  channel: 'DIRECT';
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'QRIS';
  paymentStatus: 'VERIFIED';
  note?: string;
  createdAt: serverTimestamp();
}
```

## Aturan penghitungan pendapatan

- Laporan online menghitung dokumen `payments` dengan `status == 'VERIFIED'`.
- Laporan direct menghitung dokumen `directSales` dengan `paymentStatus == 'VERIFIED'`.
- Permintaan awal dan bukti chat WhatsApp bukan pendapatan.
- Ringkasan yang tersedia saat ini merupakan akumulasi semua data terverifikasi; filter tanggal dan laba kotor belum diimplementasikan.

## Indeks

`firebase/firestore.indexes.json` berisi indeks komposit `publicProducts(isPublished, sortOrder)` untuk katalog. Firestore dapat meminta indeks tambahan ketika query baru diperkenalkan; ikuti error index dari project staging dan perbarui file indeks setelah ditinjau.
