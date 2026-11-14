# KudapKita Platform — Project Scaffold v1.0

Starter project untuk **KudapKita Digital Platform** menggunakan React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore, dan Firebase Hosting.

> Status: fondasi struktur dan alur dasar. Ini belum merupakan aplikasi bisnis yang selesai. Katalog demo, checkout guest, autentikasi owner, dashboard, daftar pesanan, serta aturan akses dasar sudah disiapkan. CRUD produk, verifikasi pembayaran lengkap, produksi, stok, penjualan langsung, laporan, dan pengaturan masih perlu implementasi dan pengujian.

## 1. Peran pengguna

| Role | Akses | Keterangan |
|---|---|---|
| Visitor | Publik | Buka beranda, baca katalog, cari produk, dan mengisi keranjang lokal. |
| Customer | Guest/anonymous session | Sesi anonim dibuat ketika checkout agar pesanan dapat dikaitkan ke UID Firebase. Tidak perlu membuat akun/password. |
| Owner | Email/password + `userProfiles/{uid}` role `owner` | Mengakses workspace privat dan mengelola operasional. |

Tidak ada halaman registrasi owner. Akun pertama harus dibuat melalui Firebase Authentication Console, lalu dokumen profil owner dibuat secara manual di Firestore.

## 2. Persyaratan lokal

- Node.js 22.12 atau lebih baru (lihat `.nvmrc`).
- npm.
- Akun Firebase untuk mengaktifkan backend.

## 3. Menjalankan project

```bash
npm install
cp .env.example .env.local
npm run dev
```

Pada Windows PowerShell, salin `.env.example` menjadi `.env.local` secara manual atau jalankan `Copy-Item .env.example .env.local`.

Isi variabel `VITE_FIREBASE_*` dari Firebase Console > Project settings > Your apps. Isi `VITE_PUBLIC_WHATSAPP_NUMBER` dengan nomor WhatsApp Business KudapKita dalam format internasional tanpa tanda `+`, spasi, atau tanda baca.

Build dan pemeriksaan TypeScript:

```bash
npm run typecheck
npm run build
npm run preview
```

## 4. Mengaktifkan Firebase Spark

1. Buat project Firebase dan daftarkan Web App.
2. Aktifkan Email/Password di Authentication untuk owner.
3. Aktifkan Anonymous sign-in untuk checkout guest.
4. Buat Cloud Firestore.
5. Deploy Rules dan indexes:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

6. Buat akun owner di Authentication Console.
7. Salin UID owner, lalu buat dokumen `userProfiles/{UID}` di Firestore:

```json
{
  "uid": "UID_DARI_FIREBASE_AUTH",
  "displayName": "Owner KudapKita",
  "email": "EMAIL_OWNER",
  "role": "owner",
  "isActive": true
}
```

Dokumen role tidak boleh dibuat dari browser. Jangan memasukkan password, private key, atau service account ke frontend.

## 5. Struktur arsitektur

Lihat `docs/PROJECT_STRUCTURE.md`, `docs/architecture/`, `docs/database/`, dan `docs/security/` untuk penjelasan lengkap.

## 6. Batasan MVP Rp0

- Tidak ada Cloud Functions.
- Tidak ada Firebase Storage; upload bukti transfer tidak tersedia. Pelanggan mengirim konfirmasi melalui WhatsApp.
- Foto katalog ditempatkan sebagai aset statis di `apps/web/public/images/products/`, bukan diunggah melalui dashboard.
- Pembayaran diverifikasi manual oleh owner.
- Firestore Rules membatasi akses. Frontend guard hanya untuk UX, bukan pengganti Security Rules.
- Katalog demo hanya tampil jika Firebase belum dikonfigurasi dan `VITE_ENABLE_DEMO_CATALOG=true`.
- Tidak ada jaminan anti-spam/anti-abuse menyeluruh tanpa lapisan backend tepercaya. Pantau penggunaan Auth dan Firestore.

Kuota Spark tidak berarti semua produk Firebase gratis tanpa syarat. Periksa halaman harga dan kuota resmi sebelum deployment.

## 7. Poin keamanan penting

- Customer hanya dapat membuat order dengan status awal `REQUESTED` dan `UNPAID`.
- Customer tidak dapat mengubah atau menghapus order setelah dikirim.
- Customer hanya dapat membaca dokumen order milik UID guest sendiri.
- Owner harus memiliki dokumen profil aktif dengan `role: owner`.
- Data internal produk, inventory, pembayaran, private settings, dan activity logs hanya dapat diakses owner.
- `displayedUnitPrice` pada request pelanggan adalah snapshot tampilan yang tidak tepercaya. Owner harus memeriksa ulang harga/ketersediaan dan mengisi total terkonfirmasi sebelum meminta pembayaran.
- Firestore Rules pada scaffold adalah baseline awal; wajib diuji di Emulator/Rules Playground sebelum digunakan dengan data nyata.

## 8. Dokumen

- `docs/requirements/` — salinan PRD final dan Design Brief yang menjadi acuan proyek.

- `docs/PROJECT_STRUCTURE.md` — direktori dan tanggung jawab.
- `docs/architecture/SYSTEM_OVERVIEW.md` — arsitektur aplikasi.
- `docs/architecture/ROLES_AND_ROUTES.md` — pemisahan area visitor/customer/owner.
- `docs/database/FIRESTORE_SCHEMA.md` — rancangan koleksi.
- `docs/security/SECURITY_MODEL.md` — hak akses dan batas Spark.
- `docs/security/FIRESTORE_RULES_TEST_MATRIX.md` — skenario allow/deny sebelum deployment.
- `docs/operations/IMPLEMENTATION_ROADMAP.md` — tahap implementasi.
- `docs/design/` — design handoff dan prototype HTML sebelumnya.
