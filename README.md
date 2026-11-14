# KudapKita Digital Platform

Platform pemesanan camilan rumahan dengan storefront publik dan workspace owner untuk operasional usaha. Repository ini memakai React 19, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore, dan Firebase Hosting.

> **Status saat ini: implementasi fitur utama pada branch pengembangan; belum berstatus rilis produksi.** Source sudah memiliki katalog publik, cart, guest checkout, tracking sesi pelanggan, login owner, dashboard, CRUD kategori/produk, pengelolaan permintaan dan pembayaran manual, pencatatan produksi, inventaris produk jadi, penjualan langsung, laporan terverifikasi, dan pengaturan toko. Build/CI, Rules Emulator, Firebase staging, serta verifikasi data operasional harus lulus sebelum rilis.

## 1. Produk dan ruang lingkup

KudapKita adalah pengembangan digital dari usaha camilan rumahan. Produk yang menjadi baseline awal katalog:

- Doko-Doko Bugis
- Risol kentang bengkuang
- Risol mayo
- Onde-onde
- Dadar gulung
- Apam

Nama produk pada demo hanya contoh awal. Harga, HPP, foto, ketersediaan, jadwal produksi, dan biaya pengantaran **tidak dikarang oleh aplikasi**; owner harus mengisinya berdasarkan data usaha yang benar.

## 2. Peran dan akses

| Peran | Hak utama |
|---|---|
| Visitor | Membaca katalog publik, mencari produk, menambah keranjang |
| Customer (guest) | Mengirim permintaan checkout melalui Firebase Anonymous Authentication dan membaca pesanan milik UID sesi sendiri |
| Owner | Mengelola katalog, pesanan, pembayaran manual, produksi, persediaan produk jadi, penjualan langsung, laporan, dan pengaturan |

Tidak ada registrasi owner publik. Akun owner dibuat di Firebase Authentication, kemudian dokumen `userProfiles/{uid}` dibuat manual oleh pemilik project. Role tidak boleh dibuat dari browser.

## 3. Menjalankan aplikasi

Persyaratan: Node.js 24.12+ dan npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Isi `.env.local` dengan konfigurasi Web App dari Firebase Console:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_PUBLIC_WHATSAPP_NUMBER` (opsional fallback; format internasional tanpa +)

Nomor WhatsApp publik utama juga bisa diatur melalui owner workspace. Jangan menaruh password, service-account JSON, private key, atau secret backend di variabel `VITE_*`.

Pemeriksaan lokal:

```bash
npm run typecheck
npm run build
npm run preview
```

## 4. Modul aplikasi

### Storefront pelanggan

- Beranda brand KudapKita dan CTA katalog.
- Katalog publik dengan pencarian dan filter kategori.
- Kartu produk memakai foto lokal jika sudah disediakan; jika belum, UI menampilkan placeholder yang jelas.
- Cart disimpan lokal pada browser.
- Checkout tanpa pembuatan password, dengan nama, nomor WhatsApp, pickup/delivery, alamat, dan catatan.
- Checkout mengirim permintaan pesanan, bukan tagihan yang otomatis disetujui.
- Setelah permintaan dibuat, pelanggan dapat melanjutkan komunikasi melalui WhatsApp.
- Tracking hanya tersedia pada sesi guest browser yang membuat pesanan. Jika sesi hilang/perangkat berganti, pelanggan perlu menghubungi owner dengan kode pesanan.

### Owner workspace

- Dashboard dan antrean permintaan.
- Kategori produk dan CRUD produk.
- Proyeksi katalog publik terpisah dari data privat produk. HPP tidak ikut dipublikasikan.
- Konfirmasi total pesanan dan verifikasi pembayaran manual.
- Alur produksi dan pemenuhan pesanan.
- Pencatatan hasil produksi untuk menambah stok produk jadi.
- Penyesuaian persediaan dengan alasan dan jejak pergerakan.
- Penjualan langsung (lapak/kampus) dengan pengurangan stok atomik.
- Laporan akumulasi pembayaran terverifikasi per kanal online dan langsung.
- Pengaturan identitas toko, WhatsApp, Instagram, rekening, dan alamat pengambilan.

## 5. Alur bisnis yang diterapkan

### Pesanan online

1. Customer memilih produk dan mengirim permintaan.
2. Dokumen dibuat pada status `REQUESTED` dan pembayaran `UNPAID`.
3. Owner memeriksa produk, jumlah, stok, jadwal, dan biaya lain.
4. Owner mengisi total final sehingga status bergerak ke `WAITING_PAYMENT`.
5. Customer menghubungi owner melalui WhatsApp dan menyelesaikan pembayaran di kanal yang disepakati.
6. Owner mencocokkan transaksi aktual, kemudian melakukan verifikasi manual.
7. Setelah pembayaran berstatus `PAID`, owner memulai persiapan. Pada tahap ini stok produk jadi dikurangi dalam transaksi Firestore yang sama dengan perubahan status dan pencatatan stock movement.
8. Pesanan bergerak ke siap diambil / pengantaran / selesai.

Status pesanan dan status pembayaran dipisahkan. Bukti atau chat WhatsApp tidak otomatis berarti pembayaran sudah lunas.

### Produksi dan persediaan

- Hasil produksi yang sudah selesai menambah stok produk jadi.
- Penyesuaian stok harus disertai alasan.
- Penjualan langsung dan mulai persiapan pesanan online mengurangi stok dengan transaksi Firestore.
- Riwayat pergerakan stok dan catatan produksi dibuat append-only melalui Rules.
- Model ini mengelola **produk jadi yang dapat dijual**, bukan bahan baku resep.

### Penjualan langsung

Penjualan lapak/kampus disimpan pada koleksi `directSales`, dengan snapshot nama produk, harga jual, jumlah, subtotal, metode pembayaran, total, dan kanal `DIRECT`. Stok dikurangi pada transaksi yang sama. Belum ada alur refund/pembatalan transaksi langsung otomatis.

## 6. Firebase dan deployment awal

1. Buat Firebase project milik KudapKita.
2. Daftarkan Web App dan salin konfigurasi ke `.env.local`.
3. Aktifkan Email/Password Authentication untuk owner.
4. Aktifkan Anonymous Authentication untuk guest checkout.
5. Buat Cloud Firestore.
6. Pastikan project Firebase yang aktif benar; jangan deploy ke project lain atau milik referensi.
7. Buat akun owner pada Authentication Console.
8. Buat dokumen `userProfiles/{UID}` secara manual:

```json
{
  "uid": "UID_DARI_FIREBASE_AUTH",
  "displayName": "Owner KudapKita",
  "email": "EMAIL_OWNER",
  "role": "owner",
  "isActive": true
}
```

9. Jalankan pemeriksaan Rules Emulator/Rules Playground sesuai `docs/security/FIRESTORE_RULES_TEST_MATRIX.md`.
10. Deploy Firestore Rules dan indexes setelah pengujian:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
11. Setelah smoke test staging lulus, build dan deploy Hosting:
```bash
npm run typecheck
npm run build
firebase deploy --only hosting
```

Jangan menjalankan deployment dari lingkungan ini sebelum project ID, akun, data, dan persetujuan pemilik dipastikan.

## 7. Batas MVP dan keputusan keamanan

- Tidak memakai Cloud Functions atau backend tepercaya.
- Tidak memakai Firebase Storage; dashboard tidak mengunggah foto atau bukti pembayaran.
- Foto katalog disimpan sebagai aset statis pada `apps/web/public/images/products/`.
- Verifikasi pembayaran dilakukan manual oleh owner; tidak ada payment gateway, QRIS dinamis, atau webhook.
- Operasi stok dan penjualan berjalan melalui Firestore transaction di client dengan aturan akses owner. Ini menjaga konsistensi untuk alur aplikasi, tetapi **bukan pengganti backend tepercaya** terhadap owner yang memodifikasi data melalui konsol/SDK sendiri.
- Rules membatasi status pesanan, pembacaan data pelanggan, dan penulisan histori. Rules tetap harus diuji pada Firebase Emulator.
- Tracking guest terkait UID anonim pada sesi browser; bukan sistem akun pelanggan lintas perangkat.
- Laporan saat ini adalah agregat sepanjang data terverifikasi yang tersedia; belum ada filter rentang tanggal, ekspor akuntansi, perhitungan laba, atau laporan HPP.
- Persediaan saat ini adalah kuantitas produk jadi; belum ada resep, stok bahan baku, konversi satuan pecahan, atau kalkulasi HPP otomatis.
- Tidak ada rate limiter/anti-spam kuat tanpa server tepercaya.
- Jangan memasukkan data transaksi riil sebelum Rules, backup, dan akses diuji.

## 8. Dependency audit\n\nCI typecheck dan build berhasil pada branch pengembangan. Namun, `npm audit` masih melaporkan empat entri high pada rantai Firebase/Firestore dan `@grpc/grpc-js`. Lihat `docs/security/DEPENDENCY_AUDIT_2026-11-14.md`. Saran downgrade besar dari npm tidak diterapkan tanpa uji kompatibilitas.\n\n## 9. Dokumen proyek

- `docs/architecture/` — arsitektur, role, dan route.
- `docs/database/FIRESTORE_SCHEMA.md` — koleksi dan snapshot transaksi.
- `docs/security/SECURITY_MODEL.md` — akses dan batasan Spark MVP.
- `docs/security/FIRESTORE_RULES_TEST_MATRIX.md` — skenario Rules yang wajib diuji.
- `docs/operations/IMPLEMENTATION_ROADMAP.md` — status implementasi.
- `docs/operations/RELEASE_CHECKLIST.md` — checklist sebelum rilis.
- `docs/audit/DAPUR_BUNDA_REFERENCE_MAPPING.md` — keputusan yang diadaptasi dari proyek Dapur Bunda.
- `docs/design/` — arah visual Warm Modern Artisanal dan design handoff.
