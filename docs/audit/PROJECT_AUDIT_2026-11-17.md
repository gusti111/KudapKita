# KudapKita — Audit Project dan UI/UX

Tanggal audit: 17 November 2026  
Basis audit: source ZIP yang diberikan, file konfigurasi, dokumentasi PRD v2.0/roadmap v2.0, dan pemeriksaan statis source. Audit ini bukan sertifikasi keamanan atau uji produksi.

## 1. Ringkasan

Aplikasi aktif adalah React + TypeScript + Vite dalam `apps/web/`, dengan Firebase di `apps/web/src/infrastructure/firebase/` dan callable backend di `functions/`. ZIP awal juga berisi implementasi statis lama di root (`app.js`, `app.css`, root `index.html`, root `sw.js`, dan `assets/`) yang tidak menjadi entry point Vite. README lama menjelaskan localStorage dan PIN owner lokal, bertentangan dengan implementasi Firebase aktif. Ini merupakan sumber utama kebingungan pemeliharaan.

Prioritas audit: **pisahkan generasi aplikasi, perbaiki responsive/UI defect, pertahankan trust boundary backend, dan jangan mengaktifkan ongkir/pembayaran yang belum punya data operasional lengkap.**

## 2. Temuan teknis utama dan tindakan

| Area | Temuan pada ZIP awal | Tindakan pada paket review |
|---|---|---|
| Arsitektur | Source React/Firebase bercampur dengan prototipe statis lama di root | README dan starter notes diperbarui; daftar file legacy untuk dihapus dicantumkan di README paket/final handover |
| Hero slider | Komponen carousel ada, tetapi class `.campaign-image` dan overlay tidak punya styling efektif di stylesheet aktif | Menambahkan layout hero, image cover, overlay, copy layer, ukuran responsif, dan animasi masuk |
| Autoplay | Carousel memakai interval tetap dan tidak mematuhi preferensi reduced motion | Autoplay berhenti saat hover/focus dan ketika OS meminta reduced motion; tombol navigasi 44 px |
| Navigasi tablet | Tombol hamburger hilang pada `md` tetapi navigasi desktop baru muncul pada `lg` | Breakpoint hamburger dan desktop nav diselaraskan pada 1024 px |
| Navigasi anchor | Link mobile memakai hash yang bukan rute React Router | Link internal diubah menjadi `/#cerita-kami` dan `/#cara-pesan`, dengan scroll setelah navigasi |
| Brand story CSS | Penutup `@media (min-width: 768px)` mengurung blok brand story yang semestinya aktif di mobile | Scope media query dirapikan |
| Kartu produk | Ada utility class `object-position-center` yang tidak dikenal Tailwind | Diganti menjadi `object-center`; alt text membedakan ilustrasi dan foto owner |
| Owner POS | UI hanya mengirim satu item walaupun callable backend menerima array item | POS sekarang mendukung penambahan, penggabungan, pengubahan jumlah, dan penghapusan item; UI mengikuti batas 6 jenis × 50 unit per jenis dari backend |
| SEO shell | `apps/web/index.html` hanya shell SPA, metadata kurang lengkap | Title, description, canonical, Open Graph, dan konten noscript ditambahkan; crawler tetap perlu runtime/prerender verification |
| Cache aset | Semua file JS/CSS/SVG/PNG/JPG/WEBP menerima immutable satu tahun | Bundle `/assets/**` tetap immutable; brand dan gambar publik memakai cache 1 hari agar foto yang diganti dapat diperbarui |
| Environment | `.env.local` dan `.cenv.local` ikut pada arsip awal; template tidak lengkap | `.env.example` ditambah storage bucket dan App Check key opsional; file environment lokal dikeluarkan dari ZIP bersih |
| Owner provisioning | Dua script helper duplikat berisi UID/email owner yang di-hardcode dan dapat membuat role owner | Kedua script helper dihapus dari paket; provisioning tetap dilakukan lewat proses administrator tepercaya sesuai panduan owner login |
| Dokumentasi | README dan petunjuk paket menyuruh menjalankan server Python pada build statis | Instruksi diselaraskan dengan Node/Vite/Firebase aktif |

## 3. Peta fitur aktual

### Sudah ada di source

- Storefront: beranda, carousel statis tiga slide, cerita brand, kategori, katalog, pencarian/filter/sortir, detail produk, keranjang browser, checkout tamu, dan halaman pelacakan.
- Owner workspace: autentikasi/route guard role, dashboard, pesanan, katalog produk, kategori, produksi, stok produk jadi, POS/penjualan langsung, laporan ringkas, dan pengaturan toko.
- Transaksi: 7 callable operations pada `functions/src/index.js`: `createOnlineOrder`, `confirmOrderQuote`, `verifyOrderPayment`, `transitionOrderStatus`, `recordProduction`, `adjustFinishedStock`, dan `createDirectSale`.
- Harga dan stok penjualan langsung dibaca/dihitung kembali oleh backend; pengurangan stok dan penulisan riwayat dilakukan melalui transaksi backend.
- HPP disimpan pada dokumen privat produk dan tidak disalin ke public product projection.
- Firestore Rules memakai prinsip deny-by-default; penulisan order, payment, inventory, stock movement, production, dan direct sales ditolak dari browser dan diarahkan melalui backend.
- Storage rules hanya membuka path gambar produk dengan pembatasan owner dan tipe/ukuran file; path lain ditolak.

### Belum tersedia atau perlu keputusan owner

| Fitur | Status / prasyarat |
|---|---|
| Ongkir real-time | Belum aktif. Butuh pin toko, poligon Pasar Bahagia/Kisaran Kuala Dua, tarif, Maps Routes/Places API, server secret, billing limit, dan pengujian batas zona/rute |
| Upload bukti transfer | Belum tersedia; Storage rules sengaja menolak upload bukti pembayaran |
| Payment gateway | Belum terintegrasi; pembayaran diverifikasi manual owner |
| CMS campaign | Slide homepage masih hard-coded di `CampaignCarousel.tsx` |
| Kupon/promo | Belum tampak sebagai alur aktif pada aplikasi Firebase saat ini |
| Akun pelanggan, histori lintas perangkat, reorder | Belum tersedia; cart lokal browser dan tracking dibatasi sesi pelanggan |
| Laporan periode/export/margin | Laporan sekarang ringkasan total transaksi tervalidasi; belum laporan periodik penuh |
| POS refund/koreksi | Belum ada alur refund/koreksi penjualan langsung |
| Bahan baku/resep/HPP otomatis | Belum ada inventori bahan baku dan recipe costing |
| App Check enforcement | Site key optional; konfigurasi/enforcement harus dikerjakan setelah reCAPTCHA web terdaftar dan diuji |
| Firebase Rules Emulator/staging | Release gate; harus lulus sebelum mengeklaim siap produksi |

## 4. Keamanan dan operasional

- `userProfiles/{uid}` tidak dapat dibuat/diubah oleh browser. Akun owner perlu diprovisioning dengan proses tepercaya.
- Pengguna anonim hanya dapat membaca order miliknya sesuai UID. Daftar seluruh order tidak diberikan ke pelanggan.
- Harga, status, dan stok transaksi bukan nilai yang dipercaya dari browser; callable backend membaca data produk dan validasi ulang.
- Kedua script owner-profile hardcoded (`scripts/fix-owner-profile.js` dan `functions/fix-owner-profile.js`) dikeluarkan dari paket agar identitas akun dan jalur pemberian role tidak tersebar sebagai source helper yang mudah salah dijalankan.
- `.env.local` bukan berkas untuk dibagikan. Firebase Web API key memang dipakai di browser dan bukan pengganti security rules; tetap jangan sertakan environment lokal. Jangan pernah membagikan Firebase Admin service account/private key.
- Security Rules dan callable contract harus diuji di Firebase Emulator/staging. Unit test domain tidak membuktikan Rules atau deployment produksi benar.
- Dependency audit terdokumentasi pada `docs/security/DEPENDENCY_AUDIT_2026-11-14.md`; temuan transitive Firebase Firestore tetap perlu dipantau, jangan gunakan `npm audit fix --force` tanpa review kompatibilitas.

## 5. Hasil pemeriksaan yang dapat dinyatakan

- `node --check functions/src/index.js`: lulus.
- `node --check functions/src/domain.js`: lulus.
- `node --test functions/test/domain.test.mjs`: **9/9 test lulus** (unit test domain).
- `npm run typecheck` dan `npm run build`: **belum dapat diverifikasi pada environment audit**. ZIP menetapkan Node.js `>=24.12.0`, tetapi runtime pemeriksaan yang tersedia Node.js `22.16.0`; instalasi dependency frontend juga tidak selesai. Karena itu tidak ada klaim build frontend sukses.
- Firebase Rules Emulator tests: belum dijalankan sebagai bagian audit ini.
- Deployment, checkout Firebase live, otorisasi owner, image upload, mobile viewport browser, dan pembayaran belum diuji end-to-end pada akun/project Firebase.
- Pemeriksaan HTML oleh page checker hanya menganalisis `apps/web/index.html` sebagai shell React SPA, bukan DOM hasil render. Skor tidak dapat dipakai untuk menyimpulkan tampilan runtime atau konversi produksi.

## 6. Release gates sebelum produksi

1. Instal dan jalankan build dengan Node 24.12.0; selesaikan TypeScript/Vite errors jika ada.
2. Jalankan Functions tests dan Firestore Rules Emulator tests; simpan hasil CI.
3. Smoke test staging untuk anonymous checkout, quote, payment verification manual, status lifecycle, stock deduction, owner guard, POS multi-item, dan akses file.
4. Konfirmasi katalog, harga, HPP, komposisi/alergen, foto asli, nomor WhatsApp, alamat pickup, rekening, jam layanan, cancellation policy, serta jam produksi.
5. Konfigurasi pengantaran baru setelah pin toko, dua zona gratis, tarif, dan Routes/Places secret tervalidasi.
6. Konfirmasi backup, billing, owner provisioning, App Check, dan sign-off owner sebelum deployment produksi.

## 7. Prinsip perubahan

Perubahan paket review mempertahankan arsitektur React/Firebase dan backend yang ada. Tidak ada penggantian ke localStorage-only, tidak ada pengisian harga/HPP/ongkir fiktif, serta tidak ada klaim transaksi otomatis yang belum didukung implementasi.
