# Audit dan Implementasi KudapKita — 18 November 2026

## Ringkasan keputusan

Project yang diaudit adalah platform React 19 + TypeScript + Vite 7 dengan Firebase Authentication, Cloud Firestore, Cloud Storage, dan Firebase Callable Cloud Functions. Source aplikasi aktif berada di `apps/web/`; backend tepercaya berada di `functions/`.

**Status rilis: NOT READY FOR PRODUCTION.** Perubahan UI responsif dan motion dasar sudah diterapkan pada source, tetapi fitur QR Device Pairing, akun Member berlangganan, verifikasi build frontend pada runtime yang sesuai, pengujian Firebase Emulator, dan validasi staging belum tersedia/selesai. Fitur yang belum ada tidak boleh dipresentasikan sebagai sudah aktif.

## Lingkup pemeriksaan

- Struktur direktori dan entry point aplikasi.
- Role, route, AuthProvider, Firestore Rules, serta batas backend callable.
- Storefront, Owner workspace, responsivitas, animasi, dan aksesibilitas dasar.
- Skrip pengujian Cloud Functions yang tersedia.
- File environment dan artefak dependency untuk paket distribusi.

## Temuan utama

| Prioritas | Area | Bukti kondisi | Dampak / keputusan |
|---|---|---|---|
| P1 | QR Owner Device Pairing | Source saat ini hanya menyediakan Owner email/password dan `userProfiles/{uid}` aktif. Tidak ditemukan endpoint pairing atau pencatatan perangkat. | Belum boleh dianggap tersedia. Rancangan aman disiapkan pada `docs/security/OWNER_DEVICE_PAIRING_DESIGN.md`; implementasi perlu diuji end-to-end sebelum dipakai. |
| P1 | Member dan langganan | Role yang terdefinisi di source adalah `owner`. Customer hanya checkout anonim; tidak ada registrasi/login Member, subscription record, entitlement, atau payment webhook. | Jangan menampilkan badge atau fitur premium yang sebenarnya belum dipenuhi. Rencana data dan UX dicatat pada `docs/architecture/MEMBER_EXPERIENCE_PLAN.md`. |
| P1 | Keamanan operasional | App Check callable bersifat opt-in dan belum enforced; deployment/staging serta emulator rules belum dibuktikan pada audit ini. | Harus menjadi release gate. Jangan deploy ke project produksi sebelum konfigurasi, backup, Emulator dan smoke test selesai. |
| P1 | Build frontend | Workspace meminta Node `>=24.12.0`, sedangkan runtime audit tersedia Node `22.16.0`. Instalasi dependency frontend tidak selesai dalam lingkungan ini. | Build/typecheck resmi belum terverifikasi. |
| P2 | Owner mobile navigation | Sebelum perubahan, sembilan menu Owner ditampilkan dalam navigasi horizontal di layar kecil sehingga mudah padat. | Diganti dengan bottom navigation untuk tiga rute inti dan drawer “Lainnya”. |
| P2 | Storefront mobile navigation | Menu mobile belum mengelola fokus/keyboard dan tidak selalu tertutup saat pathname berubah. | Ditambahkan penutupan saat navigasi, pengelolaan fokus dasar, Escape, trap Tab, dan scroll lock. |
| P2 | Motion storefront | `Reveal` telah ada, tetapi halaman beranda tidak menggunakannya dan CSS state reveal belum lengkap. | CSS reveal diselesaikan dan wrapper reveal ditambahkan pada section beranda yang dipilih; tidak semua elemen dianimasikan. |
| P2 | Konten kampanye | Carousel masih statis dari source, belum merupakan CMS kampanye di dashboard. | Tetap diperlakukan sebagai konten statis; jangan menjanjikan owner dapat mengelola campaign sebelum fitur CMS dibuat. |
| P2 | Akun guest | Guest checkout menggunakan Firebase Anonymous Auth dan riwayat pesanan terikat pada UID/browser session. | Perilaku ini dipertahankan; bukan akun pelanggan lintas perangkat. |

## Perubahan source yang dilakukan

1. `apps/web/src/areas/owner/layouts/OwnerLayout.tsx`
   - Navigasi HP memakai bottom bar untuk Ringkasan, Pesanan, Produk, dan Lainnya.
   - Enam halaman pengelolaan lain diletakkan di drawer agar tidak memadatkan layar.
   - Drawer mendukung Escape, fokus awal, pengembalian fokus, trap Tab, dan scroll lock.
   - Sidebar desktop tetap tersedia pada breakpoint desktop.

2. `apps/web/src/areas/storefront/layouts/StorefrontLayout.tsx`
   - Menu mobile ditutup ketika route/path berubah.
   - Ditambahkan fokus awal ke tautan pertama, penutupan dengan Escape, dan penutupan otomatis saat pathname berubah.
   - Menu tetap berupa dropdown inline (bukan modal), sehingga tab order dan scroll halaman tidak dikunci.
   - Hubungan `aria-controls` dengan elemen menu dipertahankan.

3. `apps/web/src/areas/owner/operations/OwnerOperationsPages.tsx`
   - Daftar produk memiliki card layout khusus HP; tablet/desktop tetap memakai tabel dengan scroll horizontal terisolasi.
   - Form dua kolom ditumpuk pada HP kecil dan kembali dua kolom pada layar yang lebih lebar.

4. `apps/web/src/areas/storefront/pages/HomePage.tsx`
   - Reveal ringan diterapkan pada beberapa section beranda, bukan pada setiap elemen.
   - Kartu kategori dan CTA diberi microinteraction yang tidak mengubah alur transaksi.

5. `apps/web/src/shared/styles/index.css`
   - Aturan `.reveal-on-scroll` dan state visible.
   - Animasi navigasi mobile Owner dan storefront.
   - Microinteraction hover/press yang dibatasi untuk perangkat pointer yang sesuai.
   - Dukungan `prefers-reduced-motion` dipertahankan dan diperluas.
   - Ruang bawah halaman Owner disesuaikan agar konten tidak tertutup bottom navigation dan safe-area perangkat.

## Prinsip data dan transaksi yang dipertahankan

- Harga, identitas produk, dan aturan transaksi yang dipercaya tetap divalidasi di backend.
- Checkout storefront tetap membuat permintaan pesanan, bukan otomatis menyetujui pesanan atau pembayaran.
- Status pembayaran dan metode pembayaran tetap terpisah.
- Mutasi transaksi, pembayaran, stok, produksi, dan penjualan tetap melalui Callable Functions.
- Tidak ada data harga, ongkir, stok, paket Member, atau testimoni baru yang dikarang.

## Hasil verifikasi yang benar-benar dilakukan

| Pemeriksaan | Hasil | Batasan |
|---|---|---|
| `npm run check` dalam `functions/` | Lulus | `node --check` untuk `src/index.js` dan `src/domain.js`. |
| `npm test` dalam `functions/` | 9/9 lulus | Unit test domain yang tersedia; bukan Firebase integration test. |
| Parse TypeScript/TSX | 51 berkas, 0 syntax error | Menggunakan TypeScript global 5.8.3 melalui `transpileModule`; bukan typecheck penuh. |
| Frontend `npm run typecheck` | Dicoba, berhenti pada dependency yang hilang | Global TypeScript 5.8.3 melaporkan enam error resolusi tipe/modul (`vite/client`, `node:url`, `vite`, plugin React, Tailwind Vite dan `ImportMeta.url` akibat types Vite tidak tersedia). Dependency install root tidak lengkap; Node aktif 22.16.0 juga di bawah requirement `>=24.12.0`. `npm run build` belum dapat diverifikasi. |
| Firestore Rules Emulator | Belum terverifikasi; percobaan berhenti di setup | `npm run test:rules` menghentikan 8 skenario pada hook karena host/port Firestore Emulator tidak tersedia. Tidak ada assertion security rule yang berhasil dieksekusi; ini bukan bukti rule lulus maupun gagal. |
| Uji browser nyata pada perangkat | Belum diverifikasi | Belum ada sesi browser/device matrix pada audit ini. |
| Staging/deployment | Tidak dilakukan | Tidak mengubah Firebase project atau deploy apa pun. |

## Release gates sebelum dipakai pelanggan

1. Gunakan Node 24.12.0, selesaikan `npm ci` hingga lengkap, lalu ulangi `npm run typecheck` dan `npm run build`.
2. Jalankan Firestore Rules Emulator test dan uji callable untuk anonymous customer, active owner, inactive owner, serta non-owner.
3. Konfigurasikan App Check pada project staging, pantau traffic valid, lalu aktifkan enforcement setelah tervalidasi.
4. Verifikasi Storage Rules, index, environment Firebase, backup, dan deployment Functions pada project staging.
5. Uji jalur kritis pada perangkat HP kecil, HP besar, tablet portrait/landscape, laptop, dan desktop; cek keyboard, zoom 200%, serta reduced motion.
6. Implementasikan dan uji QR pairing hanya sesuai rancangan keamanan yang terpisah.
7. Implementasikan Member/subscription setelah aturan paket, harga, benefit, kebijakan perpanjangan/pembatalan, dan metode pembayaran disetujui pemilik.

## Kesimpulan

Perubahan yang diterapkan memperbaiki pengalaman mobile Owner/storefront dan mengaktifkan motion reveal yang sebelumnya belum dipakai pada halaman utama. Project tetap mempertahankan arsitektur dan alur bisnis inti. Namun **QR Owner dan Member Premium belum diaktifkan**, dan rilis produksi belum layak dinyatakan siap sampai semua release gates di atas lulus.


## Storefront refinement follow-up — 18 November 2026

- Removed internal unit/package price guidance from guest-facing footer, catalog, product details, demo banner, bundle selector and cart. Guest sees the approved SKU price if present; otherwise the UI states that the manager will confirm the price.
- Replaced generated starter catalog images in guest surfaces with neutral placeholders. Starter seed records now have an empty image path; the UI accepts only owner-uploaded/approved photos and filters the six legacy generated asset paths.
- Rebuilt the home hero as a stable editorial section, replaced image-led category panels with content cards, and converted the brand story into a text-led layout.
- Rebuilt footer to four balanced columns and removed the internal catalog disclosure block.
- Set public WhatsApp fallback to the number supplied by the user (`6299509613547`) in storefront footer, hero, checkout handoff and Owner settings defaults.
- Verification after these changes: TypeScript/TSX syntax transpile passed for 52 source files with zero syntax diagnostics; PostCSS parsed the main stylesheet successfully. Full TypeScript typecheck, Vite production build and browser/device QA remain unverified because the available runtime is Node 22.16.0 while this project requires Node >=24.12.0; dependency installation did not complete in this environment.

These changes do not complete QR Owner Device Pairing or Member/subscription. Those are backend-authentication and entitlement features and remain release blockers until implemented and tested with Firebase Emulator/staging. Per-product selling prices also remain unset until the Owner approves them; no price has been invented.
