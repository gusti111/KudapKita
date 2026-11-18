# KudapKita Platform

## ⚠️ Important: NDK Not Required

This is a **web React/Vite project** - **NDK (Native Development Kit) is NOT required** for `npm run dev` to work.

The `npm run dev` command simply starts the Vite development server to serve the React web application locally. No native code compilation or Android NDK is involved.

### Project Stack:
- **React 19** + **TypeScript** + **Vite 7** + **Tailwind CSS 4**
- **Firebase** for backend services (Authentication, Firestore, Storage, Functions)
- **Node.js 24.12.0** for workspace web, **Node.js 22** for Firebase Functions

### Running the Development Server:
```powershell
npm ci
npm run dev
```
Starts Vite at `http://localhost:5173`

### No NDK Configuration:
This project contains no native C/C++ code, no `android/` folder, and no NDK setup. The Android-related items in `package-lock.json` are merely CSS optimization targets (`lightningcss-android-arm64`, `@esbuild/android-*`) used for building web assets, not native Android development.

### If You Need Android Native Code:
This web project does not support native Android development out-of-the-box. For Android functionality, a separate React Native or native module project would be required.

## Stack dan versi runtime

- React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- Firebase Authentication, Cloud Firestore, Cloud Storage, dan Callable Cloud Functions
- Node.js **24.12.0** untuk workspace web (lihat `.nvmrc` dan `package.json`)
- Node.js **22** untuk runtime Firebase Functions (lihat `functions/package.json` dan `firebase.json`)

## Menjalankan aplikasi di Windows

1. Pasang Node.js 24.12.0 atau gunakan Node Version Manager for Windows.
2. Dari folder root proyek, salin template environment:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Isi `.env.local` dengan konfigurasi Firebase Web App dari Firebase Console. Jangan bagikan file ini dan jangan commit ke Git.
4. Instal dependency dan jalankan Vite:

   ```powershell
   npm ci
   npm run dev
   ```

5. Buka alamat localhost yang ditampilkan Vite (umumnya `http://localhost:5173`).

Untuk dependency backend Functions:

```powershell
npm ci --prefix functions
npm --prefix functions run check
npm --prefix functions test
```

`VITE_ENABLE_DEMO_CATALOG=true` hanya untuk melihat katalog demo ketika Firebase belum dikonfigurasi. Checkout dan transaksi nyata memerlukan Firebase aktif. Sebelum digunakan pelanggan, pastikan konfigurasi Firebase terisi dan demo catalog dinonaktifkan (`VITE_ENABLE_DEMO_CATALOG=false`).

## Area aplikasi

### Storefront pelanggan

- Beranda dengan hero carousel, cerita brand, kategori, pilihan produk, dan cara pemesanan.
- Katalog dengan pencarian, filter, sortir, dan detail produk.
- Keranjang berbasis browser, checkout tamu, pilihan ambil sendiri/pengantaran, dan pelacakan pesanan berdasarkan sesi pelanggan.
- Navigasi mobile dengan menu ringkas, responsif untuk layar kecil; motion reveal diterapkan secara selektif dan mengikuti `prefers-reduced-motion`.
- Setelah permintaan checkout dikirim, admin memeriksa ketersediaan, jadwal, dan ongkir. Pelanggan menerima konfirmasi total akhir melalui alur operasional/WhatsApp yang tersedia.

### Workspace owner

- Login owner dan route guard berbasis role yang dibaca dari Firebase.
- Navigasi mobile Owner menggunakan bottom bar dan drawer agar semua halaman pengelolaan tetap dapat diakses tanpa menu horizontal yang padat; daftar produk berubah menjadi kartu ringkas pada layar HP.
- Dashboard, inbox pesanan, produk, kategori, produksi, persediaan produk jadi, penjualan langsung, laporan, dan pengaturan toko.
- Penjualan langsung mendukung beberapa item dalam satu transaksi.
- HPP dan pengaturan privat disimpan pada data owner, tidak dimasukkan ke proyeksi katalog publik.

## Batasan operasional yang harus dipahami

- Checkout membuat **permintaan pesanan**, bukan bukti bahwa pesanan sudah disetujui atau dibayar.
- Harga final, ongkir, jadwal, dan ketersediaan dikonfirmasi admin sebelum pembayaran.
- Verifikasi pembayaran dilakukan manual oleh owner melalui workspace. Belum ada payment gateway.
- Upload bukti transfer di dalam aplikasi belum tersedia. Storage rules saat ini sengaja menolak file selain gambar produk pada path yang diizinkan.
- Peta live, pemilihan pin pelanggan, geofence poligon, Google Maps Routes/Places API, dan kalkulasi ongkir otomatis belum diaktifkan. Zona gratis yang direncanakan adalah Pasar Bahagia dan Kisaran Kuala Dua; jangan menjanjikan ongkir otomatis sampai pin toko, batas zona, tarif, API, dan uji rute disetujui owner.
- Campaign carousel saat ini menggunakan tiga slide statis di source code; belum ada CMS campaign di dashboard owner.
- Keranjang tersimpan secara lokal pada browser. Fitur akun Member, riwayat lintas perangkat, dan reorder belum disediakan. Guest dan Member Premium belum memiliki dua dashboard terpisah.
- QR Owner Device Pairing belum tersedia. Owner saat ini tetap menggunakan login email/password; rancangan keamanan pairing tersedia di `docs/security/OWNER_DEVICE_PAIRING_DESIGN.md`.
- Sistem paket, harga, benefit, pembayaran langganan, serta entitlement Premium belum tersedia. Lihat `docs/architecture/MEMBER_EXPERIENCE_PLAN.md`; jangan menampilkan status Premium sebelum entitlement backend dibangun.
- Gambar bawaan katalog adalah ilustrasi AI dan sudah diberi label; ganti dengan foto produk aktual yang disetujui owner sebelum peluncuran komersial.
- Nama kontak, rekening, alamat, harga final, HPP, jam produksi, dan kebijakan pembatalan harus dikonfirmasi owner. Jangan mengisi angka/fakta operasional dengan tebakan.

## Tes yang tersedia

```powershell
npm run typecheck
npm run build
npm run check:functions
npm run test:functions
```

Firestore Rules Emulator tests tersedia di `functions/test/firestore.rules.test.mjs` melalui script `npm --prefix functions run test:rules`; jalankan dengan Firebase Emulator Suite sesuai dokumen security. Lulus unit test domain saja belum cukup untuk menyatakan aplikasi siap produksi.

## Firebase dan deployment

Project yang direferensikan paket ini: `kudapkita-8dd9a`. Gunakan project secara eksplisit, jangan mengandalkan alias lokal:

```powershell
firebase deploy --project kudapkita-8dd9a --only hosting
```

Deploy Functions dan security rules secara terpisah setelah backup, review environment, dan lulus staging/emulator tests:

```powershell
firebase deploy --project kudapkita-8dd9a --only functions
firebase deploy --project kudapkita-8dd9a --only firestore:rules,firestore:indexes,storage
```

Jangan melakukan deploy ke produksi sebelum owner mengonfirmasi data toko, konfigurasi pembayaran/pengiriman, akun owner, billing, backup, dan hasil uji lintas perangkat. File `.firebaserc` hanya menyimpan project reference; tidak berisi kredensial.

## Struktur utama

```text
apps/web/       React storefront + owner workspace + PWA assets
functions/      Trusted Firebase callable backend and tests
firebase/       Firestore/Storage security rules and indexes
docs/           Architecture, design, security, operations, and audit docs
02_Dokumentasi/ PRD and technical roadmap v2.0 (source of product decisions)
```

## Data dan keamanan

- `.env.local` berisi konfigurasi lokal dan wajib tetap di komputer pengembang. Jangan kirim atau commit.
- `.env.example` hanya template tanpa kredensial.
- Jangan pernah memasukkan Firebase Admin service-account JSON, private key, password, token, atau payment credential ke source ZIP.
- Perubahan order, pembayaran, stok dan penjualan langsung melewati callable backend; browser tidak diberi izin menulis langsung ke koleksi transaksi.
- Owner profile dibuat melalui proses provisioning tepercaya; jangan membuat role owner dari client/browser.


## Audit dan perubahan UI 18 November 2026

- Audit struktur, role, keamanan, dan rancangan Member/QR: `docs/audit/PROJECT_AUDIT_IMPLEMENTATION_2026-11-18.md`.
- Rincian redesign frontend tahap kedua: `docs/audit/FRONTEND_REDESIGN_PHASE_2_2026-11-18.md`.
- Rancangan keamanan QR Owner: `docs/security/OWNER_DEVICE_PAIRING_DESIGN.md`.
- Rencana pengalaman Guest/Member: `docs/architecture/MEMBER_EXPERIENCE_PLAN.md`.

Tahap kedua memperbarui katalog, dialog produk, keranjang, checkout, pelacakan pesanan, dashboard Owner, dan manajemen pesanan. Status saat ini tetap **belum siap produksi**: QR pairing dan Member subscription belum aktif; build/typecheck frontend resmi, emulator, staging, dan uji browser/perangkat masih perlu dilakukan.
