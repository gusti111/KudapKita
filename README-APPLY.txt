KUDAPKITA — PROFESSIONAL STOREFRONT REFINEMENT
Tanggal: 18 November 2026

ISI PATCH
- Footer empat kolom yang seimbang; blok panduan harga internal dihapus dari halaman publik.
- Nomor WhatsApp +62 995-0961-3547 menjadi kontak publik dan fallback checkout.
- Harga publik hanya menampilkan harga SKU yang disahkan Owner. Jika belum ada, tampil status konfirmasi pengelola.
- Paket campur tidak menampilkan rentang harga/promo internal.
- Ilustrasi AI starter tidak lagi ditampilkan pada katalog, detail, homepage, bundle, atau keranjang. Foto hanya tampil setelah diunggah/disetujui Owner.
- Homepage hero, kategori, cerita brand, dan katalog dirapikan dengan layout lebih editorial dan minim dekorasi generik.
- Default nomor WhatsApp pada Pengaturan Owner diisi sesuai nomor yang diberikan.

CARA MENERAPKAN (PowerShell)
1. Ekstrak ZIP ke folder Downloads.
2. Buka PowerShell pada folder root project (folder yang berisi package.json).
3. Jalankan perintah berikut (sesuaikan folder jika lokasi ekstrak berbeda):

   $patch = Join-Path $HOME 'Downloads\KudapKita_Storefront_Professional_Refinement\apply_patch.ps1'
   & $patch -ProjectRoot (Get-Location).Path

Script membuat backup file yang akan ditimpa di .local-backups\storefront-refinement-20261118. Tidak menyentuh node_modules, .env, Firebase config, atau data Firestore.

SETELAH PATCH
   npm run typecheck
   npm run build
   npm run dev

PENTING
- Harga jual per produk belum diisi karena angka final per SKU belum diberikan/disahkan. Tidak ada harga yang dikarang. Isi harga di Owner > Produk.
- QR Owner Device Pairing dan Member/subscription belum aktif. Keduanya membutuhkan backend, security rules, keputusan produk, dan uji Emulator/staging; jangan menganggapnya selesai hanya karena desain UI.
- Build penuh dan browser QA harus dijalankan pada Node >=24.12.0.
