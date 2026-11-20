# KudapKita — Frontend Redesign Phase 2

Tanggal: 18 November 2026  
Arah desain: **Warm Modern Artisanal**  
Status: **implementasi source selesai untuk ruang lingkup frontend tahap ini; build dan browser QA masih menunggu environment dependency yang sesuai**.

## Tujuan

Membuat pengalaman pelanggan dan Owner lebih rapi, mudah dipahami, dan nyaman di layar kecil maupun besar tanpa mengganti arsitektur React/Firebase atau mengubah kontrak transaksi.

## Perubahan yang diterapkan

### 1. Storefront pelanggan

- Katalog diberi hero yang lebih tegas, toolbar/filter dan kartu produk dengan hierarki harga, status ketersediaan, label ilustrasi, serta tombol tambah yang lebih jelas.
- Detail produk menggunakan dialog responsif; mendukung Escape, fokus awal, trap Tab, penguncian scroll latar, dan pengembalian fokus ke pemicu setelah dialog ditutup.
- Keranjang memakai kartu per item, kontrol kuantitas yang mudah disentuh, tombol hapus dengan label aksesibel, serta ringkasan estimasi yang menjelaskan bahwa ini belum merupakan tagihan final.
- Checkout dibagi menjadi bagian informasi penerima dan cara menerima pesanan. Ringkasan menekankan bahwa harga, ketersediaan, dan biaya antar tetap dikonfirmasi Owner.
- Setelah checkout berhasil, pelanggan melihat kode permintaan, langkah berikutnya, tautan pelacakan, dan WhatsApp bila nomor publik tersedia.
- Pelacakan pesanan menampilkan tahapan berdasarkan status, memisahkan status pembayaran dari status pesanan, menyediakan tombol perbarui status, dan memberi keterangan berbeda untuk pickup/delivery.
- Menu mobile diberi perilaku keyboard yang lebih konsisten, termasuk Escape, trap Tab, dan pengembalian fokus ke tombol menu ketika ditutup.

### 2. Workspace Owner

- Dashboard dirancang ulang dengan sapaan, ringkasan operasional, indikator yang berasal dari data pesanan terbaru dan ringkasan penjualan terverifikasi, daftar aktivitas, prioritas, dan akses cepat.
- Daftar pesanan menyediakan pencarian nama/kontak/kode, filter status, jumlah per filter, serta kartu pesanan yang lebih mudah dibaca pada HP.
- Alur menetapkan total, menolak permintaan, memverifikasi pembayaran, serta memperbarui status tetap menggunakan repository dan Callable Functions yang sudah ada.
- Komponen heading dan panel operasional diberi gaya bersama agar halaman Owner lebih konsisten.
- Bottom navigation Owner tetap dipakai pada layar kecil; halaman lain tersedia melalui drawer. Konten diberi ruang bawah agar tidak tertutup bottom navigation dan safe area.

### 3. Motion dan responsivitas

- Menggunakan animasi masuk section yang selektif, microinteraction tombol/kartu, transisi modal, dan loading skeleton.
- Animasi dibatasi berdasarkan interaksi perangkat pointer; tidak semua elemen diberi gerakan.
- `prefers-reduced-motion` dihormati.
- CSS memiliki aturan adaptasi di breakpoint sekitar 1023px, 639px, dan 380px, termasuk perubahan grid dan ukuran kontrol.
- Kontrol utama yang direvisi menggunakan target sentuh sekitar 44px atau lebih; ruang label dan layout tetap disesuaikan agar tidak sempit di layar kecil.

## File utama yang berubah

- `apps/web/src/areas/owner/dashboard/pages/OwnerDashboardPage.tsx`
- `apps/web/src/areas/owner/orders/pages/OwnerOrdersPage.tsx`
- `apps/web/src/areas/owner/operations/OwnerOperationsPages.tsx`
- `apps/web/src/areas/storefront/pages/CatalogPage.tsx`
- `apps/web/src/areas/storefront/pages/CartPage.tsx`
- `apps/web/src/areas/storefront/pages/CheckoutPage.tsx`
- `apps/web/src/areas/storefront/pages/TrackOrderPage.tsx`
- `apps/web/src/areas/storefront/layouts/StorefrontLayout.tsx`
- `apps/web/src/shared/styles/index.css`

File layout/navigation/home page yang sudah diperbarui pada tahap sebelumnya tetap disertakan.

## Batasan yang sengaja dipertahankan

- Tidak menambah akun Member, subscription, paket/harga Premium, payment gateway langganan, atau entitlement palsu. Itu tahap backend terpisah setelah keputusan paket dan aturan langganan disetujui.
- Tidak mengaktifkan QR Owner Device Pairing melalui URL atau token client-only. Pairing perlu callable/backend, approval dari sesi Owner aktif, token terbatas waktu dan sekali pakai, pencatatan perangkat, serta revoke.
- Tidak mengubah koleksi Firestore, security rules, atau alur transaksi inti.
- Order creation, konfirmasi harga, verifikasi pembayaran, transisi status, serta mutasi stok tetap menggunakan backend tepercaya.
- Tidak mengganti harga produk, ongkir, biaya, stok, alamat, atau jadwal dengan angka yang tidak bersumber dari data project.

## Verifikasi yang dilakukan

| Pemeriksaan | Hasil | Makna |
|---|---:|---|
| Parse seluruh TypeScript/TSX | 51 berkas, 0 syntax error | Pemeriksaan sintaks transpile, bukan typecheck penuh |
| Parse CSS via PostCSS | Berhasil, 366 top-level nodes, 1.771 baris | Sintaks CSS dapat diparse |
| Cloud Functions syntax check | Lulus | `node --check` untuk entrypoint dan domain |
| Cloud Functions domain tests | 9/9 lulus | Unit test domain yang tersedia |
| Frontend `npm run typecheck` | Terhambat | Dependency `vite/client`, `vite`, plugin React/Tailwind dan Node type tidak tersedia dalam runtime audit; Node aktif 22.16.0 di bawah requirement project `>=24.12.0` |
| Frontend production build | Belum terverifikasi | Belum dapat dibuktikan tanpa dependency yang lengkap dan runtime yang sesuai |
| Firestore Rules Emulator | Belum terverifikasi | Emulator belum berjalan saat tes rules sebelumnya dicoba |
| Browser dan device matrix | Belum dilakukan | Belum ada pengukuran visual nyata pada HP/tablet/desktop |

## Langkah berikutnya

1. Pada komputer pengembang, gunakan Node.js 24.12.0, jalankan `npm ci`, lalu `npm run typecheck` dan `npm run build`.
2. Perbaiki seluruh error type/build yang muncul; jangan lanjut deploy jika build belum bersih.
3. Jalankan emulator Firestore dan tes rules serta callable pada akun guest, Owner, dan pengguna non-Owner.
4. Jalankan browser QA pada viewport HP kecil, HP besar, tablet portrait/landscape, laptop, dan desktop; cek fokus keyboard, zoom 200%, serta reduced motion.
5. Setelah frontend stabil, lanjutkan implementasi backend Member Premium dan QR Owner Device Pairing di staging.

## Putusan

Frontend tahap ini telah mengalami pembaruan yang nyata pada katalog, detail produk, keranjang, checkout, pelacakan, dashboard Owner, serta pengelolaan pesanan. **Ini bukan klaim bahwa seluruh produk siap rilis.** Typecheck/build resmi, emulator, browser QA, serta dua fitur backend baru masih merupakan pekerjaan lanjutan.
