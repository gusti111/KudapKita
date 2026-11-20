# Changelog

## 2026-11-18 — Responsive Owner workspace and motion polish

- Owner mobile workspace: compact bottom navigation for core routes and a secondary drawer for the remaining owner pages.
- Improved keyboard/focus handling and Escape behavior for Owner and storefront mobile navigation; the Owner drawer locks background scrolling, while the storefront menu remains an inline dropdown.
- Enabled selective storefront section reveal animations; added restrained category-card and CTA microinteractions.
- Respected reduced-motion preferences and device safe-area spacing.
- Added current audit, Owner QR pairing security design, and Guest/Member experience plan.
- QR pairing and Member subscriptions remain planned/not active; frontend build and device testing remain release gates.

## 2026-11-18 — Frontend redesign phase 2

- Redesigned Owner dashboard with operational KPIs based on existing order and verified-sales data, recent activity, attention list, and shortcuts.
- Redesigned Owner order management with search, status filters, count chips, clearer order cards, and existing callable-based actions retained.
- Polished catalog/product cards and made the product detail dialog keyboard accessible with Escape, focus trap, and focus restoration.
- Redesigned cart and checkout surfaces, quantity controls, order summary, and successful request confirmation without changing the trusted order-creation flow.
- Redesigned order tracking as a status timeline, clarified verified-payment messaging, and added a manual status refresh action.
- Added responsive visual rules for storefront and Owner operational surfaces; motion stays restrained and respects reduced-motion.
- Implementation details and verification limits: `docs/audit/FRONTEND_REDESIGN_PHASE_2_2026-11-18.md`.

— KudapKita Platform

## Paket review 17 November 2026

### Perbaikan storefront dan aksesibilitas
- Memastikan hero carousel memiliki lapisan gambar, overlay, dan copy yang benar pada semua ukuran layar.
- Memperbaiki navigasi mobile/tablet dan tautan internal ke bagian Cerita Kami serta Cara Pesan.
- Menambahkan dukungan preferensi `prefers-reduced-motion` untuk menghentikan autoplay carousel.
- Memperbesar target kontrol carousel hingga 44 px dan memperbaiki teks alternatif gambar produk.
- Memperbaiki struktur CSS responsif agar komponen cerita brand tidak tersembunyi pada mobile.
- Memperbarui metadata halaman utama dan fallback konten saat JavaScript tidak aktif.
- Memperbaiki beberapa karakter teks yang sebelumnya rusak.

### Owner workspace
- Form Penjualan Langsung kini dapat menggabungkan beberapa jenis produk dalam satu transaksi.
- Batas input pada UI diselaraskan dengan kontrak backend: maksimal 6 jenis produk dan 50 unit per produk.
- Harga final, stok, dan mutasi tetap divalidasi dan dihitung oleh callable backend.

### Operasional dan pemeliharaan
- Mengubah cache policy: bundle hasil build tetap immutable; gambar dan aset brand dapat diperbarui tanpa menunggu cache satu tahun.
- Melengkapi `.env.example` dengan Storage Bucket dan App Check site key opsional.
- Mengganti README lama yang merujuk ke aplikasi localStorage statis dengan instruksi React/Vite/Firebase yang aktif.
- Mengarsipkan hasil audit serta memperjelas fitur yang sudah tersedia dan yang masih menunggu keputusan owner.

### Tidak diubah / tidak diklaim selesai
- Tidak menyalakan kalkulasi ongkir otomatis karena koordinat toko, poligon zona, tarif, dan API key server belum tersedia.
- Tidak menambahkan payment gateway atau upload bukti transfer di aplikasi.
- Tidak mengganti backend Firebase, struktur koleksi, atau security rules dengan implementasi lokal.


## 2026-11-18 — Storefront refinement
- Removed internal price-guide ranges and package promo estimates from all public visitor surfaces.
- Public products without approved SKU prices now display a clear price-confirmation state instead of an estimated range.
- Removed generated AI product illustrations from public storefront placements; only owner-uploaded product photos are shown.
- Reworked the homepage hero, category panels, brand story and footer into a restrained, consistent layout.
- Set the supplied WhatsApp contact as the public fallback and Owner settings default.
- Kept final price, stock, delivery and payment confirmation in the existing trusted Owner/backend flow.
