# KudapKita — UI/UX Design Handoff v1.0

**Dokumen turunan:** PRD KudapKita v1.0 dan Design Brief KudapKita v1.0  
**Referensi implementasi:** Dapur Bunda Operational System  
**Status:** Rancangan awal untuk review; bukan spesifikasi produksi final.

## 1. Ringkasan keputusan desain

KudapKita menggunakan satu platform web responsif dengan dua area pengalaman:

1. **Customer storefront** untuk katalog, keranjang, checkout, informasi pembayaran, dan pelacakan pesanan.
2. **Business management workspace** untuk pengelolaan pesanan, pembayaran, produk, produksi, stok produk jadi, penjualan langsung, dan laporan.

Kedua area menggunakan bahasa visual yang sama, tetapi pola interaksinya dibedakan. Storefront dibuat hangat, ringan, dan berorientasi produk. Dashboard dibuat padat namun tenang, berorientasi tugas, dan memprioritaskan antrean tindakan.

Prototype HTML yang menyertai dokumen ini memperlihatkan arah visual dan beberapa interaksi demo. Prototype tidak mengirim data ke backend, tidak membuat pesanan nyata, tidak memverifikasi pembayaran, dan tidak menyimpan data pelanggan.

## 2. Sasaran UX

- Pelanggan dapat menemukan produk, memahami ketersediaan, dan menyusun permintaan pesanan tanpa diwajibkan membuat akun.
- Pelanggan memahami bahwa permintaan pesanan perlu diperiksa dan disetujui admin sebelum menjadi pesanan resmi.
- Admin dapat mengetahui pekerjaan yang membutuhkan tindakan: permintaan baru, pembayaran yang perlu diperiksa, produksi, dan pesanan siap diserahkan.
- Status pesanan dan status pembayaran selalu ditampilkan sebagai dua informasi yang terpisah.
- Informasi internal seperti resep, HPP, dan catatan produksi tidak pernah muncul pada katalog publik.
- Pengalaman desktop dan mobile berasal dari satu sistem desain dan satu pola navigasi yang konsisten.

## 3. Sitemap / information architecture

### Customer storefront

- Beranda
  - Hero dan CTA katalog
  - Keunggulan layanan
  - Produk unggulan
  - Paket dan snack box
  - Cara pemesanan
  - Footer / informasi kontak
- Katalog
  - Kategori
  - Pencarian dan filter
  - Detail produk
  - Pilihan varian / jumlah
- Keranjang
  - Item dan kuantitas
  - Subtotal sementara
  - Catatan pesanan
- Checkout
  - Identitas pelanggan
  - Nomor WhatsApp
  - Pickup / delivery
  - Tanggal dan catatan
  - Ringkasan permintaan
- Pelacakan pesanan
  - Kode / tautan akses aman
  - Status pesanan
  - Status pembayaran
  - Rincian konfirmasi admin
- Informasi pembayaran
  - Instruksi pembayaran setelah konfirmasi admin
  - Upload bukti pembayaran
  - Status verifikasi

### Admin workspace

- Ringkasan
- Pesanan
  - Permintaan baru
  - Pesanan resmi
  - Detail pesanan
- Pembayaran
  - Antrean bukti pembayaran
  - Detail pemeriksaan
  - Setujui / tolak dengan alasan
- Produk dan paket
  - Produk
  - Kategori
  - Varian dan bundling
  - Ketersediaan dan publikasi
- Produksi
  - Menunggu disiapkan
  - Sedang diproses
  - Siap diserahkan
- Persediaan produk jadi
  - Stok tersedia
  - Stok dipesan
  - Penyesuaian
  - Riwayat pergerakan
- Penjualan langsung
- Laporan
- Pengaturan bisnis

## 4. Alur pengguna utama

### A. Pelanggan mengajukan pesanan

1. Pelanggan membuka beranda/katalog.
2. Memilih produk, varian, serta jumlah.
3. Meninjau keranjang.
4. Mengisi nama, WhatsApp, metode pemenuhan, tanggal yang diinginkan, dan catatan.
5. Sistem membuat `order_request` dan memberikan kode permintaan.
6. Admin memeriksa ketersediaan, kapasitas produksi, jadwal, dan biaya pengiriman.
7. Admin memberikan konfirmasi atau mengajukan perubahan harga/jadwal.
8. Pelanggan menyetujui detail final.
9. Sistem membuat pesanan resmi dan mengunci snapshot harga.
10. Pelanggan menerima instruksi pembayaran.
11. Pelanggan membayar dan mengunggah bukti.
12. Admin mencocokkan bukti dengan transaksi aktual.
13. Pembayaran disetujui atau ditolak disertai alasan.
14. Pesanan diteruskan ke produksi, disiapkan, diambil/dikirim, lalu diselesaikan.

### B. Admin menangani pesanan

1. Admin masuk ke dashboard.
2. Membuka antrean permintaan baru.
3. Memeriksa detail produk, jumlah, jadwal, kapasitas, dan pemenuhan.
4. Menyetujui, menolak dengan alasan, atau mengajukan perubahan.
5. Setelah detail disepakati, permintaan dikonversi menjadi pesanan resmi tanpa input ulang item.
6. Admin mengirim instruksi pembayaran.
7. Admin memverifikasi pembayaran aktual.
8. Pesanan yang memenuhi syarat masuk ke antrean produksi.
9. Admin memperbarui status siap diambil/dikirim dan selesai.

### C. Admin mencatat penjualan langsung

1. Admin/kasir memilih produk yang dijual langsung.
2. Memasukkan kuantitas dan metode pembayaran.
3. Backend memvalidasi harga dan ketersediaan.
4. Transaksi disimpan dan pergerakan stok dicatat secara konsisten.
5. Penjualan masuk ke laporan dengan kanal `DIRECT`.

## 5. Visual direction

**Arah:** Warm Modern Artisanal — modern, bersih, ramah, dan dekat dengan konteks kuliner rumahan.

- Storefront: latar cream/off-white, headline serif yang hangat, foto produk menjadi fokus, aksen terracotta untuk CTA, dan sage untuk sinyal ketersediaan.
- Dashboard: latar abu-hijau sangat muda, permukaan putih, navigasi hijau-sage, teks gelap, dan warna semantik hanya untuk status.
- Hindari dekorasi berlebihan, glassmorphism berat, gradien neon, animasi yang mengganggu, serta kartu dengan terlalu banyak shadow.
- Foto produk final harus berupa foto milik KudapKita yang konsisten pencahayaan, crop, background, dan rasio. Ilustrasi pada prototype hanya placeholder visual.

## 6. Design tokens awal

| Token | Nilai | Penggunaan |
|---|---|---|
| `brand-950` | `#33231D` | Teks/area brand paling gelap |
| `brand-900` | `#493127` | Header gelap dan komponen utama |
| `accent-700` | `#B85D2E` | CTA dan aksen storefront |
| `accent-100` | `#F8E8D8` | Surface aksen lembut |
| `sage-700` | `#54745B` | Status ketersediaan dan aksen dashboard |
| `sage-100` | `#E8EFE7` | Surface dashboard |
| `cream-50` | `#FFFDF9` | Surface utama storefront |
| `cream-100` | `#F8F4EC` | Background storefront |
| `ink-900` | `#302822` | Teks utama |
| `ink-500` | `#877A70` | Teks sekunder |
| `line` | `#E9E1D6` | Border dan divider |

**Typography:** Georgia untuk heading display; system sans-serif untuk body, form, angka, dan komponen.  
**Spacing:** skala dasar 4px; gunakan ritme 8px untuk layout umum.  
**Radius:** 10px (kontrol), 16px (card), 24px (section), 32px (hero).  
**Breakpoints:** mobile <= 720px; tablet 721–1000px; desktop > 1000px.  
**Touch target:** minimal 44×44px untuk kontrol utama.

## 7. Komponen inti

| Komponen | Variasi / state penting | Aturan |
|---|---|---|
| Button | Primary, secondary, outline, ghost, destructive; hover, focus, disabled, loading | Satu primary action per area utama |
| Product card | Default, unavailable, pre-order, featured | Harga, satuan, dan ketersediaan harus jelas |
| Category chip | Default, selected, disabled | Filter aktif harus tampak tanpa bergantung pada warna saja |
| Cart item | Normal, quantity update, removed | Subtotal diperbarui setelah perubahan kuantitas |
| Form field | Default, focus, error, disabled | Label tetap terlihat; pesan error spesifik |
| Status badge | Neutral, info, warning, success, danger | Warna selalu disertai teks status |
| Data table | Default, sorted, filtered, empty, loading | Angka rata kanan; kolom aksi konsisten |
| Modal / drawer | Open, close, submitting, error, success | Fokus masuk ke dialog; Escape menutup bila aman |
| Empty state | No items, no results, no records | Jelaskan penyebab dan tindakan berikutnya |
| Toast | Success, info, warning, error | Tidak menjadi satu-satunya tempat menampilkan pesan penting |

## 8. Status dan microcopy

### Status pesanan

- `REQUESTED` — Permintaan diterima
- `WAITING_PAYMENT` — Menunggu pembayaran
- `PREPARING` — Sedang disiapkan
- `READY_FOR_PICKUP` — Siap diambil
- `OUT_FOR_DELIVERY` — Sedang dikirim
- `COMPLETED` — Selesai
- `REJECTED` — Ditolak
- `CANCELLED` — Dibatalkan

### Status pembayaran

- `UNPAID` — Belum dibayar
- `PROOF_SUBMITTED` — Bukti dikirim
- `PAID` — Terverifikasi
- `PROOF_REJECTED` — Bukti perlu diperbaiki
- `REFUNDED` — Dana dikembalikan

Status pembayaran tidak boleh mengubah status pesanan secara implisit tanpa aturan bisnis. Metode pembayaran (misalnya transfer bank atau QRIS) merupakan field tersendiri, bukan status pembayaran.

Contoh microcopy:
- “Permintaan pesanan diterima. Admin akan memeriksa ketersediaan dan jadwal terlebih dahulu.”
- “Total akhir menunggu konfirmasi admin.”
- “Bukti pembayaran diterima. Pembayaran belum dinyatakan lunas sampai diverifikasi.”
- “Bukti pembayaran belum dapat diverifikasi. Periksa kembali nominal dan unggah bukti yang sesuai.”
- “Pesanan siap diambil.”

## 9. Responsive behavior

- Desktop storefront: navigasi horizontal, hero dua kolom, katalog empat kolom.
- Tablet storefront: hero dua kolom yang lebih rapat, katalog dua kolom.
- Mobile storefront: hero satu kolom, katalog dua kolom, bottom navigation, tombol keranjang mudah dijangkau.
- Desktop admin: sidebar tetap, topbar, KPI row, dashboard panels, tabel penuh.
- Tablet admin: sidebar dipadatkan atau menjadi menu collapsible; panel disusun vertikal bila ruang tidak cukup.
- Mobile admin: sidebar diganti bottom navigation untuk menu utama; tabel dapat digulir horizontal; KPI dua kolom; form satu kolom.
- Jangan menyembunyikan status, total, atau tindakan kritis hanya demi menghemat ruang.

## 10. Accessibility dan QA

- Kontras teks normal minimal 4.5:1; teks besar minimal 3:1.
- Seluruh kontrol interaktif dapat digunakan dengan keyboard dan memiliki focus indicator.
- Semua input mempunyai label yang terlihat; error dikaitkan dengan field terkait.
- Status tidak boleh dibedakan hanya menggunakan warna.
- Gambar produk final membutuhkan alt text deskriptif.
- Area sentuh utama minimal 44×44px.
- Hormati `prefers-reduced-motion`.
- Dialog mengelola fokus, memiliki judul, dan dapat ditutup dengan cara yang jelas.
- Uji layout pada lebar 360px, 390px, 768px, 1024px, dan 1440px.
- Uji empty, loading, error, success, disabled, dan data panjang.

## 11. Batasan prototype

File `kudapkita-platform-prototype.html` merupakan mockup interaktif berbasis data ilustrasi. Interaksi yang tersedia meliputi perpindahan mode storefront/admin, filter kategori, tambah/hapus kuantitas keranjang, simulasi checkout, navigasi halaman admin, dan dialog simulasi pemeriksaan pembayaran. Semua aksi hanya mengubah tampilan lokal.

Tidak termasuk: login sungguhan, backend, database, file upload, pengiriman WhatsApp, pembayaran, konfirmasi pesanan nyata, reservasi stok, laporan aktual, dan sinkronisasi antarperangkat.

## 12. Keputusan yang masih harus dikonfirmasi pemilik usaha

- Logo dan identitas visual final.
- Nama, foto, deskripsi, kategori, varian, harga, dan satuan final setiap produk.
- Jadwal produksi dan batas pemesanan/pre-order.
- Stok minimum, kebijakan reservasi stok, dan kapan stok dikurangi.
- Area pengantaran, tarif, metode serah-terima, dan jam operasional.
- Rekening/QRIS, batas waktu pembayaran, aturan pembayaran kurang/lebih, serta kebijakan refund.
- Role admin/staf yang benar-benar dibutuhkan dan siapa yang berwenang menyetujui pembayaran.
- Apakah penjualan langsung wajib masuk MVP dan bagaimana proses kasirnya.

## 13. Kriteria persetujuan desain

Desain dapat masuk ke tahap implementasi setelah:

1. Pemilik menyetujui struktur storefront dan dashboard.
2. Alur permintaan → konfirmasi → pesanan resmi → pembayaran → produksi → pemenuhan disepakati.
3. Setiap halaman memiliki state loading, empty, error, dan success yang relevan.
4. Tampilan mobile dan desktop telah ditinjau.
5. Design tokens dan komponen disepakati sebagai acuan konsisten.
6. Placeholder konten diganti atau tetap diberi label sampai data final tersedia.
