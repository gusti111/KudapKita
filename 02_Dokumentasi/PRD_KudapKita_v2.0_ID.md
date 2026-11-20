# PRD KudapKita v2.0
## Integrated Business Platform

**Versi:** 2.0  
**Tanggal:** 16 November 2026  
**Status:** Draft untuk validasi owner dan tim implementasi  
**Platform:** Responsive Web Application / Progressive Web App (PWA)  
**Produk:** KudapKita - pemesanan jajanan dan pengelolaan operasional usaha  
**Tagline:** *Teman ngemil, dekat di hati.*

> **Penanda dokumen**  
> **[SUDAH ADA]** berarti ditemukan pada source code atau dokumentasi project yang diperiksa. **[PENGEMBANGAN]** berarti kebutuhan baru atau penyempurnaan untuk v2.0. **[KONFIRMASI OWNER]** berarti keputusan/nilai bisnis belum tersedia dan harus diberikan owner. **[GERBANG RILIS]** berarti fitur belum boleh dianggap siap produksi sebelum kriteria validasinya lulus.

---

## 1. Ringkasan Eksekutif

KudapKita v2.0 dikembangkan sebagai platform bisnis terintegrasi untuk menghubungkan aktivitas pelanggan dengan proses operasional usaha. Platform mencakup storefront, katalog, keranjang, checkout, pengelolaan pesanan, pembayaran, produksi, stok, POS, pengantaran, promosi, pelanggan, dan analitik.

Arah produk yang disetujui adalah **Integrated Business Platform**. Prioritas pengembangan berturut-turut adalah **delivery, operations, marketing, customer, dan analytics**. Pengembangan tambahan seperti keamanan, performa, aksesibilitas, SEO, backup, dan observabilitas menjadi fondasi wajib, bukan fitur opsional.

Dua ruang kerja utama:

1. **Customer Storefront:** pelanggan melihat produk, memilih paket, menentukan pickup/delivery, melihat biaya secara transparan, mengirim pesanan, melakukan pembayaran sesuai metode yang disediakan, dan melacak status pesanan.
2. **Owner Workspace:** owner mengelola produk, pesanan, pembayaran, pengantaran, produksi, persediaan, penjualan langsung, promo, pelanggan, laporan, serta konfigurasi usaha.

V2.0 adalah **pengembangan bertahap dari project yang sudah ada, bukan rewrite**. Source code yang diperiksa telah menggunakan React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Firebase Authentication, Cloud Firestore, Firebase Callable Functions v2, Firebase Storage, dan Firebase Hosting. Batas domain dan pola transaksi backend yang ada harus dipertahankan.

Kebutuhan paling penting adalah sistem ongkir berbasis **rute jalan yang dapat dilalui kendaraan**. Pengiriman gratis hanya berlaku pada area yang disetujui owner di Pasar Bahagia dan cakupan Kisaran Kuala Dua. Di luar poligon gratis, server menghitung rute berkendara dari titik toko yang telah diverifikasi ke pin tujuan pelanggan, kemudian menerapkan tarif yang disetujui owner. Jarak garis lurus tidak boleh digunakan sebagai pengganti jarak rute. Bila rute tidak tersedia, sistem meminta konfirmasi manual atau menawarkan pickup; sistem tidak boleh menebak ongkir.

Harga produk, HPP, stok awal, titik toko, poligon zona gratis, tarif ongkir, jam layanan, batas jarak, kanal pembayaran, kebijakan pembatalan/refund, dan data pelanggan yang akan disimpan merupakan keputusan owner. Dokumen ini tidak mengarang nilai-nilai tersebut.

## 2. Tujuan Produk dan Ukuran Keberhasilan

### 2.1 Visi

Menjadikan KudapKita sebagai tempat pemesanan jajanan yang mudah dan tepercaya bagi pelanggan sekaligus pusat kendali operasional harian bagi owner.

### 2.2 Tujuan bisnis

- Memudahkan pelanggan menemukan produk dan menyelesaikan pemesanan dari ponsel.
- Memastikan ongkir dan total pembayaran ditampilkan sebelum pelanggan mengirim pesanan.
- Mengurangi pekerjaan manual untuk rekap pesanan, kebutuhan produksi, dan stok.
- Menjaga harga, promo, pembayaran, ongkir, dan perubahan stok tetap tervalidasi di backend.
- Membantu owner memahami penjualan, produk populer, biaya, dan margin setelah data HPP/biaya cukup andal.
- Mendorong pembelian ulang tanpa spam atau promosi yang tidak disetujui pelanggan.

### 2.3 KPI yang perlu dicatat

| KPI | Definisi | Catatan |
|---|---|---|
| Conversion checkout | Pesanan berhasil dibuat / checkout dimulai | Baseline perlu dikumpulkan setelah event analytics aktif |
| Pesanan selesai | Jumlah pesanan berstatus selesai dalam periode | Pisahkan pickup dan delivery |
| Waktu konfirmasi | Median dari pesanan dibuat hingga dikonfirmasi owner | Ukur dari timestamp server |
| Waktu pemenuhan | Median dari pesanan dikonfirmasi hingga siap/terkirim | Segmentasikan berdasarkan metode pemenuhan |
| Akurasi stok | Selisih stok sistem dengan hitung fisik | Audit berkala |
| Biaya pengiriman per pesanan | Total ongkir yang dibebankan dan biaya aktual bila dicatat | Jangan menyamakan ongkir tertagih dengan biaya kurir aktual |
| Pembelian ulang | Pelanggan yang melakukan lebih dari satu pesanan pada rentang periode | Hanya bila identitas pelanggan tersedia dan sah digunakan |
| Gross margin | Penjualan bersih dikurangi HPP berdasarkan resep/biaya yang valid | Jangan diberi label laba bersih sebelum biaya operasional dicatat |
| Rasio produk terbuang | Kuantitas produk rusak/tidak terjual dibanding produksi | Memerlukan pencatatan waste |

Target angka KPI ditetapkan setelah baseline dikumpulkan. Jangan memasang target numerik tanpa data awal.

## 3. Baseline Source Code dan Kondisi Saat Ini

### 3.1 Stack yang ditemukan

| Area | Implementasi saat ini |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| UI styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Backend transaksi | Firebase Callable Functions v2 |
| File/media | Firebase Storage |
| Hosting | Firebase Hosting |
| Backend region | `asia-southeast2` |
| PWA | Web manifest dan service worker |

Arsitektur source telah memisahkan `app`, `areas/storefront`, `areas/owner`, `domain`, `data`, dan `infrastructure`. Pertahankan pola tersebut; fitur baru masuk ke lapisan/domain yang sesuai, bukan menambah semua logika ke halaman React.

### 3.2 Fitur yang sudah ada [SUDAH ADA]

| Modul | Kondisi yang ditemukan | Batas saat ini |
|---|---|---|
| Storefront | Beranda, hero carousel, katalog, kartu produk, kategori, pencarian/filter, keranjang, checkout, pelacakan pesanan | Konten carousel masih statis di frontend |
| Bundle | UI pemilih campuran produk | Belum menjadi mesin harga paket/diskon otoritatif di backend |
| Identitas pelanggan | Firebase Anonymous Authentication untuk checkout guest | Pelacakan terkait UID/sesi browser, belum lintas perangkat |
| Checkout | Nama, WhatsApp, pickup/delivery, alamat teks, catatan | Belum ada map pin, zona gratis, maupun quote ongkir rute |
| Order backend | `createOnlineOrder`, `confirmOrderQuote`, `verifyOrderPayment`, `transitionOrderStatus` | Konfirmasi pembayaran manual; belum ada payment gateway/webhook |
| Login owner | Email/password dan pemeriksaan profil owner aktif | Belum ada role kasir/staf produksi |
| Produk/kategori | CRUD owner, dokumen private dan proyeksi `publicProducts`/`publicCategories` | Informasi HPP/internal harus tetap private |
| Stok | Saldo produk jadi dan histori pergerakan | Belum ada bahan baku/resep/HPP otomatis |
| Produksi | `recordProduction` menambah stok produk jadi | Belum ada papan produksi agregat per tanggal pemenuhan |
| POS | Backend `createDirectSale` menerima array item | UI owner saat ini masih menampilkan satu baris produk |
| Laporan | Pembayaran terverifikasi dan direct sales | Belum ada filter periode, expense, HPP, margin, atau ekspor lengkap |
| Pengaturan | Identitas/kontak storefront dan private settings | Belum ada editor zona/tarif pengiriman dan campaign manager |
| Keamanan | Firestore rules default-deny, pemeriksaan owner backend, transaksi callable, idempotency | App Check enforcement belum menjadi gerbang wajib; audit log masih perlu diperkuat |

### 3.3 Status order dan pembayaran yang ditemukan

Status pesanan yang digunakan mencakup `REQUESTED`, `WAITING_PAYMENT`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `COMPLETED`, `REJECTED`, dan `CANCELLED`. Status pembayaran mencakup `UNPAID`, `WAITING_VERIFICATION`, `PAID`, `REJECTED`, dan `REFUNDED`.

Transisi status harus tetap dilakukan melalui backend. Saat status berubah ke `PREPARING`, alur existing mengurangi stok produk jadi secara atomik. Desain v2 perlu memutuskan kebijakan reservasi stok dengan hati-hati agar tidak terjadi double deduction ketika verifikasi pembayaran, pembatalan, dan persiapan pesanan berjalan bersamaan.

### 3.4 Risiko teknis yang wajib ditangani

1. Arsip awal yang diunggah memuat `.env.local`, `.cenv.local`, dan entri `.git`. Arsip tersebut jangan didistribusikan. Tinjau isinya dan riwayat Git untuk memastikan tidak ada private key/token yang terekspos. Rotasi kredensial privat bila ditemukan. Konfigurasi Firebase web yang memang publik harus dibedakan dari service-account key atau secret server.
2. Laporan audit dependency pada project mencatat paket web dengan tingkat severity tinggi. Audit ulang harus dilakukan sebelum rilis tanpa `npm audit fix --force` atau downgrade yang tidak tervalidasi.
3. Audit project mencatat bundle utama sekitar 901 kB minified. Ukur ulang, lalu pecah route/vendor yang berat melalui lazy loading.
4. `package.json` meminta Node.js `>=24.12.0`, sedangkan lingkungan inspeksi tersedia Node `22.16.0`. Karena itu, dokumen ini tidak mengklaim build/typecheck baru telah lulus.
5. Dokumen arsitektur, skema, rules, dan kontrak callable harus diperbarui bersama setiap perubahan. Pastikan gambaran Cloud Functions sesuai dengan implementasi sebenarnya.
6. Log aktivitas saat ini perlu ditingkatkan menjadi audit log yang andal untuk aksi sensitif: perubahan status/order, pembayaran, ongkir manual, stok, promo, akses role, dan refund.

### 3.5 Source yang menjadi dasar penilaian

Penilaian mengacu pada `README.md`, `package.json`, `apps/web/src/app/router.tsx`, halaman dan komponen storefront/owner, provider auth/cart, repository data, domain entities/rules, `functions/src/index.js`, `functions/src/domain.js`, Firestore/Storage rules, indexes, serta dokumentasi architecture, database, security, delivery, callable contract, deployment, implementation roadmap, dan PRD v1.0 yang ada pada arsip project.

## 4. Pengguna, Peran, dan Hak Akses

| Peran | Kebutuhan utama | Akses yang diusulkan |
|---|---|---|
| Pengunjung | Melihat produk dan promosi | Baca proyeksi data publik; tanpa akses data privat |
| Pelanggan guest | Membuat dan melacak pesanan dari sesi saat ini | Checkout terbatas dan akses hanya ke pesanan milik UID terkait |
| Pelanggan terdaftar [PENGEMBANGAN] | Riwayat lintas perangkat, alamat tersimpan, reorder | Data profil dan pesanan miliknya; autentikasi dan verifikasi identitas |
| Owner | Mengelola seluruh usaha dan konfigurasi | Full access sesuai pemeriksaan backend |
| Kasir [PENGEMBANGAN] | Mencatat penjualan langsung dan melihat transaksi yang diperlukan | Role terbatas; tidak boleh mengubah HPP, konfigurasi rahasia, atau role |
| Staf produksi [PENGEMBANGAN] | Melihat kebutuhan produksi dan mencatat hasil produksi | Role terbatas pada produksi dan pergerakan stok sesuai kewenangan |
| Admin konten/marketing [PENGEMBANGAN] | Mengelola banner dan promosi | Role terbatas pada campaign/promo; publikasi dapat memerlukan persetujuan owner |

RBAC tidak boleh hanya disembunyikan di frontend. Setiap callable harus memvalidasi UID, role, status aktif, dan scope izin di backend.

## 5. Cakupan Produk v2.0

### 5.1 Prioritas

- **P0 - Wajib sebelum peluncuran v2:** delivery quote yang akurat, checkout transparan, order lifecycle andal, data aman, stok tidak negatif, operasi owner, audit, dan pengujian.
- **P1 - Pengembangan inti berikutnya:** papan produksi, multi-item POS, campaign manager, kupon/paket terverifikasi backend, profil pelanggan, riwayat lintas perangkat, laporan terstruktur.
- **P2 - Tahap lanjutan:** bahan baku/resep/HPP otomatis, loyalty/referral, analitik cohort, otomatisasi, dan integrasi pembayaran eksternal jika volume serta kebutuhan membenarkan.

### 5.2 Di luar cakupan awal

- Marketplace multi-penjual.
- Pelacakan GPS kurir real-time.
- Aplikasi native Android/iOS terpisah.
- Chatbot AI yang menjadi kanal transaksi utama.
- Pembukuan akuntansi penuh/pajak sebelum kebutuhan dan aturan bisnisnya ditetapkan.
- Payment gateway otomatis sebagai prasyarat rilis pertama. Pembayaran manual yang tercatat tetap menjadi opsi awal.

## 6. Kebutuhan Fungsional

## 6.1 Delivery Management [P0]

**Tujuan:** menghitung kelayakan layanan dan ongkir secara konsisten berdasarkan rute jalan kendaraan.

### Persyaratan

- **DEL-01:** Owner dapat menyimpan titik asal toko yang tervalidasi (latitude/longitude dan alamat tampilan). Nilainya berstatus [KONFIRMASI OWNER].
- **DEL-02:** Owner dapat mengelola zona pengiriman gratis menggunakan poligon geografis, minimal zona Pasar Bahagia dan area Kisaran Kuala Dua yang telah disepakati. Nama wilayah saja tidak cukup untuk keputusan otomatis; batas poligon harus ditentukan.
- **DEL-03:** Pelanggan dapat mencari alamat dengan autocomplete, memilih hasil alamat, dan menyesuaikan pin lokasi pada peta.
- **DEL-04:** Sistem memeriksa titik tujuan terhadap poligon gratis di backend. Titik di dalam zona aktif menghasilkan ongkir Rp0.
- **DEL-05:** Titik di luar zona gratis dihitung dengan Google Maps Routes API menggunakan mode `DRIVE` (atau mode lain hanya jika dipilih dan diuji secara eksplisit). Nilai jarak adalah `routes.distanceMeters`, bukan jarak geodesik/garis lurus.
- **DEL-06:** Tarif dihitung server berdasarkan konfigurasi aktif dan disimpan sebagai snapshot pada quote serta pesanan. Rumus awal yang diusulkan:

  `billableKm = ceil(routeDistanceMeters / 1000)`  
  `deliveryFee = max(minimumFee, baseFee + billableKm * ratePerKm)`

  Semua nilai tarif adalah [KONFIRMASI OWNER]. Owner juga dapat memilih skema bertingkat bila lebih cocok dengan biaya operasional.
- **DEL-07:** Quote memiliki expiry, UID pemilik, koordinat tujuan/hash, versi tarif, versi zona, jarak rute, durasi estimasi, dan nominal ongkir. Usulan awal expiry 10 menit perlu divalidasi terhadap pengalaman checkout dan biaya API.
- **DEL-08:** `createOnlineOrder` wajib memvalidasi quote yang masih berlaku, sesuai UID dan tujuan. Backend menghitung ulang total dari harga katalog dan diskon yang sah; browser tidak boleh mengirim nilai ongkir final yang dipercaya.
- **DEL-09:** Owner dapat melakukan override ongkir/kelayakan dengan alasan wajib dan audit trail.
- **DEL-10:** Jika Routes API gagal, lokasi tidak dapat dijangkau, kuota habis, atau quote kedaluwarsa, sistem tidak membuat estimasi palsu. Tampilkan pesan minta konfirmasi manual atau tawarkan pickup.
- **DEL-11:** UI menampilkan subtotal produk, diskon, ongkir, dan total akhir sebelum pesanan dikirim.
- **DEL-12:** Owner dapat mengatur jam layanan, jarak maksimum, metode pemenuhan yang tersedia, dan status sementara pengantaran (aktif/jeda), bila kebijakan ini disetujui.

### Aturan tarif

1. Zona gratis diputuskan oleh koordinat tujuan dan poligon aktif di server, bukan input teks area pelanggan.
2. Zona poligon memiliki versi dan tanggal berlaku. Perubahan zona tidak boleh mengubah snapshot ongkir pesanan yang sudah dibuat.
3. Pembulatan jarak harus konsisten. Jika memakai `ceil`, pembulatan dilakukan setelah meter dikonversi ke kilometer.
4. Nilai uang disimpan sebagai integer rupiah, bukan floating point.
5. Minimum fee, base fee, rate per km, max service distance, serta pembebanan tarif perlu konfirmasi owner.
6. Jika toko memiliki beberapa titik asal atau titik produksi, itu merupakan pengembangan terpisah dan tidak diasumsikan sekarang.

### Kriteria penerimaan delivery

- Alamat di dalam masing-masing poligon mendapat Rp0.
- Titik di luar poligon menggunakan hasil rute kendaraan dari titik toko yang benar.
- Quote kedaluwarsa, quote UID lain, quote dengan koordinat berubah, atau versi tarif yang tidak berlaku tidak dapat dipakai.
- Manipulasi ongkir/jarak di browser tidak mengubah tagihan backend.
- Kegagalan Maps tidak menghasilkan ongkir berdasarkan garis lurus.
- Owner dapat melihat alasan override dan siapa yang melakukannya.

## 6.2 Order, Checkout, dan Pembayaran [P0]

- **ORD-01:** Checkout tetap mendukung guest agar hambatan pemesanan rendah.
- **ORD-02:** Informasi penting pelanggan dan alamat tervalidasi; nomor WhatsApp disimpan dengan akses terbatas.
- **ORD-03:** Tampilkan ringkasan produk, jumlah, subtotal, diskon, biaya kirim, total, dan metode pemenuhan.
- **ORD-04:** Order memiliki snapshot nama/varian/harga produk, quote delivery, diskon, dan aturan yang digunakan ketika order dibuat.
- **ORD-05:** Pengiriman dan pickup memiliki status serta detail pemenuhan yang jelas.
- **ORD-06:** Pembayaran manual memiliki status menunggu verifikasi, diterima, ditolak, dan refund jika didukung oleh proses owner. Sistem tidak boleh mengklaim pembayaran berhasil sebelum owner/penyedia pembayaran mengonfirmasi.
- **ORD-07:** Histori perubahan status disimpan sebagai event immutable, termasuk aktor, timestamp server, status lama/baru, dan alasan bila perlu.
- **ORD-08:** Pesanan memiliki idempotency key agar tap ganda/retry jaringan tidak menciptakan dua pesanan.
- **ORD-09:** Pelanggan dapat melihat estimasi pemenuhan, tetapi estimasi tidak boleh dipresentasikan sebagai janji pasti sebelum kapasitas operasional ditetapkan.

### Status yang diusulkan

Pertahankan status existing jika memungkinkan. Tambahkan status baru hanya bila benar-benar membedakan proses, misalnya `WAITING_MANUAL_DELIVERY_CONFIRMATION`. Status pengembalian dana harus dibedakan antara status pembayaran dan status pesanan. Semua perubahan harus melalui transisi backend yang diizinkan.

### Kriteria penerimaan order

- Pesanan baru menyimpan snapshot harga, delivery, diskon, dan metode pemenuhan.
- Pelanggan tidak dapat membaca pesanan pelanggan lain hanya dengan menebak ID order.
- Pembayaran tidak dapat diubah oleh client menjadi PAID.
- Retry request dengan idempotency key yang sama tidak menghasilkan pesanan ganda.
- Pembatalan dan refund mengikuti kebijakan owner, tidak diasumsikan otomatis.

## 6.3 Operations: Pesanan, Produksi, Stok, dan POS [P0/P1]

### Order inbox [P0]

- Tampilan antrean dengan filter status, tanggal, pickup/delivery, status pembayaran, dan pengecualian delivery.
- Ringkasan total dan snapshot ongkir ditampilkan pada detail pesanan.
- Tombol aksi sesuai transisi yang diizinkan; aksi berisiko meminta konfirmasi.
- Histori status tersedia di detail order.

### Production board [P1]

- Mengagregasi kuantitas pesanan terkonfirmasi menurut produk dan tanggal pemenuhan.
- Memisahkan kebutuhan, target produksi, hasil aktual, dan kekurangan.
- Owner dapat memasukkan target/notes produksi.
- Hasil produksi menggunakan callable `recordProduction` yang ada; semua movement tercatat.
- Status/qty order harus mencegah perhitungan ganda.

### Persediaan produk jadi [P0]

- Pertahankan data `inventory` dan `stockMovements` yang ada.
- Tentukan kebijakan reservasi: rekomendasi `onHandQty`, `reservedQty`, `availableQty`; reservasi saat pembayaran terverifikasi, konsumsi saat mulai dipersiapkan, dan pelepasan pada pembatalan yang memenuhi syarat.
- Keputusan tersebut harus dikonfirmasi owner dan diuji pada kondisi dua pelanggan memesan stok terakhir secara bersamaan.
- Perubahan stok manual wajib memiliki jenis alasan, catatan, aktor, nilai sebelum/sesudah, dan referensi.
- Stok tidak boleh negatif kecuali owner membuat kebijakan pengecualian yang eksplisit dan tercatat.

### POS multi-item [P1]

- UI POS dibuat seperti keranjang dengan tambah/ubah/hapus beberapa item.
- Gunakan callable `createDirectSale` yang sudah menerima array item.
- Backend membaca harga dan stok kanonis; nilai total dari browser hanya untuk pratinjau.
- Satu transaksi POS menghasilkan satu dokumen penjualan dan movement stok yang atomik.

### Bahan baku, resep, dan HPP [P2]

- Tambahkan bahan baku, satuan, resep/BOM per produk, yield produksi, biaya bahan dan biaya lain yang owner pilih.
- Produksi mengurangi bahan baku dan menambah produk jadi secara terkontrol.
- HPP dihitung dari resep dan batch aktual, dengan versi resep agar histori transaksi tidak berubah bila resep diperbarui.
- HPP tidak dipublikasikan ke pelanggan.
- Laporan margin hanya diaktifkan setelah data biaya valid dan disetujui owner.

### Kriteria penerimaan operasi

- Papan produksi merangkum pesanan berdasarkan tanggal dengan kuantitas benar.
- Dua transaksi bersamaan tidak menyebabkan stok negatif atau double deduction.
- Pembatalan melepaskan reservasi hanya satu kali.
- POS mendukung banyak item dalam satu transaksi.
- Setiap penyesuaian stok dan hasil produksi memiliki movement record.

## 6.4 Marketing: Campaign, Promo, dan Paket [P1]

### Campaign manager

- Owner dapat membuat campaign dengan judul, eyebrow, deskripsi, media type, path gambar/video, poster video, alt text, CTA, urutan, status, waktu mulai/selesai, dan metadata publikasi.
- Slide hard-coded `CampaignCarousel` dipindah ke proyeksi public campaign agar dapat dikelola tanpa deployment.
- Media disimpan di Storage dengan batas MIME/ukuran dan rules owner-only.
- Video dimuat lazy, muted, dengan poster/fallback gambar. Jangan autoplay audio.
- Campaign yang belum aktif/berakhir tidak boleh muncul di storefront.
- Owner dapat preview, jadwalkan, pause, publish, dan archive.

### Promotion engine

- Kupon dapat berupa fixed amount atau persentase.
- Aturan mencakup tanggal, minimum belanja, produk/kategori eligible, redemption cap, batas per pelanggan, dan kebijakan stacking.
- Backend menghitung diskon pada quote/order. Client tidak menentukan nominal diskon.
- Penebusan dicatat atomik agar dua request tidak memakai kupon terakhir secara bersamaan.
- Promo harus menghindari hidden fee atau harga yang menyesatkan.

### Bundle/package

- Mendukung paket tetap dan paket campuran pilihan pelanggan.
- Harga paket ditentukan oleh aturan owner, bukan nilai petunjuk UI yang ada sekarang.
- Snapshot bundle dan item komponennya masuk ke pesanan.
- Validasi stok dan promo tetap server-side.

### Kriteria penerimaan marketing

- Owner mengubah campaign tanpa source deployment.
- Campaign publik hanya tampil dalam window aktif.
- Media gagal dimuat memiliki poster/fallback.
- Kupon kedaluwarsa, batas penggunaan, minimum belanja, dan manipulasi diskon ditolak server.
- Paket campuran memiliki subtotal dan harga final yang konsisten dengan konfigurasi owner.

## 6.5 Customer: Akun, Riwayat, Reorder, dan Feedback [P1]

- Guest checkout tetap tersedia.
- Akun pelanggan merupakan fitur opsional; pelanggan dapat mendaftar/login untuk menyatukan riwayat lintas perangkat.
- Proses linking anonymous UID ke akun terverifikasi harus mempertahankan kepemilikan order dengan prosedur aman.
- Riwayat order hanya bisa dibaca oleh pemilik terautentikasi atau melalui token akses privat yang aman dan tidak mudah ditebak.
- Reorder membuat cart baru dari snapshot barang sebelumnya; harga dan stok selalu diperiksa ulang dari katalog saat ini.
- Alamat tersimpan bersifat opsional, pelanggan dapat menghapus/mengubahnya.
- Review hanya dapat dibuat untuk order yang selesai dan satu order tidak bisa membuat review berulang tanpa aturan.
- Notifikasi WhatsApp/email hanya dikirim sesuai consent dan kebijakan privasi; jangan mengirim promo massal tanpa persetujuan.
- Siapkan proses permintaan penghapusan akun/data sesuai kewajiban yang berlaku dan retensi transaksi.

### Kriteria penerimaan customer

- Guest masih dapat checkout.
- Pelanggan yang login bisa melihat riwayat order lintas perangkat.
- Pengguna tidak dapat mengakses profil/alamat/order pengguna lain.
- Reorder menggunakan harga dan stok terbaru.
- Ulasan terkait order selesai dan dapat dimoderasi owner.

## 6.6 Analytics dan Laporan [P1]

### Laporan penjualan

- Filter tanggal, kanal (online/POS), metode pemenuhan, produk/kategori, dan status.
- Pisahkan nilai pesanan, pembayaran yang benar-benar diterima, refund, diskon, ongkir yang ditagih, dan penjualan POS.
- Jangan menghitung order yang belum dibayar/diterima sebagai kas masuk.
- Ekspor CSV untuk analisis lanjutan.

### Analitik operasional

- Jumlah pesanan menurut status.
- Waktu konfirmasi dan pemenuhan.
- Produk paling banyak dipesan.
- Kebutuhan produksi dibanding hasil aktual.
- Stok rendah, penyesuaian stok, dan waste.
- Kinerja delivery: zona, jarak rute, frekuensi manual quote, dan error API tanpa mempublikasikan alamat pribadi.

### Analitik pelanggan dan marketing

- Pelanggan baru/berulang hanya jika identitas valid tersedia.
- Campaign click-through dan pesanan yang terkait campaign jika tracking consent dan desain event sudah disetujui.
- Coupon redemption dan nilai diskon.

### Margin

Gross margin baru dihitung setelah HPP/recipe dan biaya relevan sudah andal. Biaya pengiriman aktual, kemasan, komisi, dan operasional harus dicatat jika ingin menghitung margin kontribusi atau laba bersih. Hindari menyebut gross margin sebagai laba bersih.

### Kriteria penerimaan analytics

- Laporan memakai definisi metrik yang terdokumentasi.
- Order unpaid/rejected/cancelled tidak tercampur sebagai penjualan diterima.
- Jumlah dan total laporan dapat direkonsiliasi dengan pembayaran/direct sales.
- Ekspor mengikuti filter aktif dan tidak memuat data privat yang tidak diperlukan.

## 7. Struktur Navigasi dan Layar

### 7.1 Customer storefront

| Layar | Fungsi utama | CTA utama |
|---|---|---|
| Beranda | Campaign, kategori, produk pilihan, keunggulan pengiriman | Lihat menu |
| Katalog | Cari/filter/sort produk dan ketersediaan | Tambah ke keranjang |
| Detail produk | Foto, deskripsi, harga, satuan/paket, stok/ketersediaan | Tambah ke keranjang |
| Paket & promo | Paket tetap/campuran dan kupon aktif | Pilih paket |
| Keranjang | Ubah jumlah dan cek subtotal | Lanjut checkout |
| Checkout | Kontak, pickup/delivery, pin Maps, quote dan total | Kirim pesanan |
| Status pesanan | Timeline status dan informasi pembayaran/pengantaran | Hubungi toko / lihat detail |
| Akun pelanggan | Profil, alamat, order history, reorder | Pesan lagi |

### 7.2 Owner workspace

| Layar | Fungsi utama |
|---|---|
| Ringkasan | Pesanan baru, perlu aksi, produksi, stok rendah, ringkasan penjualan |
| Pesanan | Filter, detail, konfirmasi harga, pembayaran, status, histori |
| Pengiriman | Zona, tarif, quote manual, exception, pengaturan jam layanan |
| Produksi | Kebutuhan per hari, target, hasil, kekurangan |
| Produk & kategori | Katalog, foto, ketersediaan, harga, atribut |
| Persediaan | Stok jadi, pergerakan, penyesuaian, (tahap lanjutan) bahan baku |
| POS | Keranjang multi-item, pembayaran penjualan langsung, nota |
| Marketing | Campaign, kupon, bundle, jadwal publikasi |
| Pelanggan | Profil terbatas, histori, consent, permintaan data |
| Laporan | Penjualan, produk, operasional, ekspor, margin bila valid |
| Pengaturan | Profil toko, jam operasi, pembayaran, user/role, kebijakan delivery |

## 8. Alur Pengguna Utama

### 8.1 Pemesanan delivery

1. Pelanggan membuka katalog dan menambah produk.
2. Pelanggan memilih delivery pada checkout.
3. Pelanggan mencari alamat, memilih hasil autocomplete, lalu memastikan pin di peta.
4. Frontend meminta quote ke callable backend.
5. Backend memeriksa poligon zona gratis. Jika di luar zona, backend meminta rute DRIVE ke Routes API dan menghitung tarif dari setting aktif.
6. Frontend menampilkan rincian produk, diskon (jika ada), ongkir, expiry quote, dan total.
7. Saat pelanggan mengirim pesanan, backend memvalidasi quote dan membaca ulang harga/stok/promo.
8. Order dibuat dengan snapshot yang dapat diaudit; owner memproses dan pelanggan melihat status.

### 8.2 Pemesanan pickup

1. Pelanggan memilih pickup.
2. Sistem menampilkan jadwal/slot pickup yang disetujui owner.
3. Ongkir bernilai Rp0 karena pickup, bukan karena termasuk zona gratis.
4. Order dibuat dan masuk antrean owner.

### 8.3 Operasi owner

1. Owner membuka order inbox dan memeriksa permintaan baru.
2. Owner menyetujui/menolak atau mengonfirmasi quote sesuai kebijakan.
3. Pembayaran manual diperiksa dan dicatat.
4. Sistem mengelola reservasi/konsumsi stok sesuai keputusan kebijakan.
5. Produksi melihat total kebutuhan berdasarkan hari pemenuhan.
6. Pesanan menjadi siap pickup atau dikirim, lalu selesai.
7. Perubahan penting tersimpan sebagai audit trail.

## 9. Model Data Target

Nama di bawah adalah **usulan perluasan** atas koleksi existing, bukan klaim bahwa semua telah tersedia.

### 9.1 Koleksi existing yang dipertahankan

`userProfiles`, `publicProducts`, `products`, `publicCategories`, `categories`, `orders`, `orderPrivate`, `payments`, `inventory`, `stockMovements`, `productionRuns`, `directSales`, `publicSettings`, `privateSettings`, `activityLogs`.

### 9.2 Koleksi/dokumen baru yang diusulkan

| Koleksi | Tujuan | Data kunci |
|---|---|---|
| `deliverySettings/current` | Titik toko, formula tarif, batas jarak/jam layanan | origin, tariffVersion, baseFee, ratePerKm, minimumFee, maxServiceDistance, active |
| `deliveryZones/{zoneId}` | Area gratis dan zona layanan | name, polygon, type, active, version, effectiveAt |
| `deliveryQuotes/{quoteId}` | Quote ongkir sementara | uid, destinationHash, routeDistanceMeters, duration, fee, zoneId, tariffVersion, expiresAt, status |
| `orderStatusHistory/{eventId}` | Histori status immutable | orderId, actorUid, fromStatus, toStatus, reason, createdAt |
| `campaigns/{id}` | Data campaign private | title, media, CTA, schedule, status, author, publishedAt |
| `publicCampaigns/{id}` | Proyeksi aman untuk storefront | field publik campaign saja |
| `promotions/{id}` | Aturan diskon/kupon | code, type, value, eligibility, limits, date window, status |
| `promotionRedemptions/{id}` | Catatan pemakaian kupon | promotionId, orderId, customerRef, amount, createdAt |
| `customerProfiles/{uid}` | Profil pelanggan opsional | displayName, contact, consent, createdAt, updatedAt |
| `customerAddresses/{id}` | Alamat tersimpan | uid, label, address, coordinates, isDefault |
| `wasteRecords/{id}` | Produk terbuang/rusak | productId, quantity, reason, costSnapshot, actorUid, createdAt |
| `ingredients/{id}` | Bahan baku [P2] | name, unit, onHandQty, reorderLevel |
| `recipes/{productId}` | Resep/komposisi versi [P2] | version, inputs, yield, effectiveAt |
| `expenses/{id}` | Biaya operasional [P2] | category, amount, date, note, actorUid |
| `auditLogs/{id}` | Audit log durable untuk aksi sensitif | actorUid, action, entity, entityId, before/after summary, reason, timestamp |

### 9.3 Prinsip data

- Simpan dokumen private terpisah dari proyeksi public.
- Jangan pernah mengirim HPP, private settings, private contact, service key, atau data sensitif melalui proyeksi publik.
- Gunakan timestamp server untuk status/pembayaran/stock movement.
- Nilai uang disimpan integer rupiah.
- Simpan snapshot aturan untuk harga, diskon, zona, dan ongkir agar histori order tidak berubah ketika konfigurasi baru dipasang.
- Koordinat/alamat tujuan adalah data pribadi; minimalkan akses, masa simpan, logging, dan ekspor.
- Buat indeks Firestore sesuai query aktual; hindari query luas yang tidak dibatasi.

## 10. Integrasi dan Kontrak Backend

### 10.1 Callable functions existing

Pertahankan dan perluas kontrak: `createOnlineOrder`, `confirmOrderQuote`, `verifyOrderPayment`, `transitionOrderStatus`, `recordProduction`, `adjustFinishedStock`, dan `createDirectSale`.

### 10.2 Callable baru yang diusulkan

| Callable | Fungsi |
|---|---|
| `calculateDeliveryQuote` | Memvalidasi alamat/koordinat, zona, rute kendaraan, dan ongkir |
| `ownerUpdateDeliverySettings` | Mengubah titik toko/tarif/jam/jarak dengan izin owner |
| `ownerUpsertDeliveryZone` | Membuat/memperbarui poligon gratis dan versi zona |
| `ownerOverrideDeliveryQuote` | Override/manual confirmation dengan alasan dan audit |
| `ownerUpsertCampaign` / `ownerPublishCampaign` | Mengelola dan mempublikasikan campaign |
| `validatePromotion` | Memeriksa eligibility promo untuk ringkasan checkout |
| `ownerRecordWaste` | Mencatat produk rusak/terbuang dan movement terkait |
| `ownerRecordStockReservation` | Mengelola reservasi/release jika model reservasi disetujui |
| `customerLinkProfile` | Menghubungkan identitas guest ke akun terverifikasi |
| `customerGetOrderHistory` | Mengambil order milik customer dengan scope backend |

Nama akhir mengikuti konvensi source code; tabel ini adalah rancangan kontrak.

### 10.3 Aturan transaksi

- Perubahan stok, redemption promo, pembayaran, order state, dan penjualan POS harus atomik.
- Lakukan pembacaan yang diperlukan sebelum write dalam Firestore transaction.
- Jangan memanggil Google Maps, mengirim WhatsApp, atau menjalankan side-effect eksternal di dalam callback Firestore transaction karena callback dapat diulang ketika terjadi contention.
- Gunakan idempotency key pada operasi yang mungkin diulang.
- Simpan hasil eksternal (misalnya response Routes) sebagai quote terpisah sebelum membuat transaksi order.

## 11. UI/UX, Responsiveness, dan Motion

### 11.1 Arah visual

- Brand KudapKita tetap hangat, ramah, dan dekat sebagai bisnis jajanan rumahan.
- Palet usulan: cream/warm ivory, terracotta, cocoa/dark brown, dan aksen hijau lembut untuk status sukses. Final token harus diuji kontrasnya.
- Gunakan foto produk asli yang disetujui owner; gambar ilustrasi tidak boleh dipresentasikan sebagai foto asli produk.
- Hero campaign mendukung gambar dan video pendek dengan poster/fallback, tanpa audio autoplay.
- Tata letak editorial dan ruang putih yang cukup; hindari dashboard dengan terlalu banyak kartu yang tidak membantu tindakan.

### 11.2 Responsive

- Mobile-first; navigasi pelanggan sederhana dan tombol penting mudah dijangkau ibu jari.
- Breakpoint mengikuti sistem desain project dan diuji pada lebar 360 px, 390 px, tablet, laptop, dan desktop.
- Tabel owner berubah menjadi kartu/daftar pada layar kecil bila lebih mudah dibaca.
- Form checkout tetap dapat digunakan dengan keyboard layar dan tidak kehilangan isi ketika quote gagal.

### 11.3 Motion

- Microinteraction tombol: sekitar 100-200 ms.
- Transisi antar panel/halaman: sekitar 200-400 ms bila tidak mengganggu.
- Scroll reveal ringan, bukan efek berat untuk setiap elemen.
- Skeleton loading untuk konten, feedback jelas untuk sukses/gagal.
- Wajib menghormati `prefers-reduced-motion`; animasi tidak boleh menghambat aksesibilitas atau pemuatan konten.

## 12. Non-Functional Requirements

| Kategori | Persyaratan |
|---|---|
| Security | Firestore/Storage default-deny; otorisasi backend; App Check; secret server di Secret Manager; audit log |
| Privacy | Minimasi data; consent promosi; akses pelanggan hanya miliknya; kebijakan retensi alamat/nomor telepon |
| Reliability | Callable idempotent; transaksi stok/order atomic; retry aman; fallback manual delivery |
| Performance | Lazy route/media; gambar WebP/AVIF; ukuran bundle dipantau; tidak memblokir halaman utama dengan video |
| Accessibility | Label form, focus state, kontras minimum WCAG AA untuk teks normal, alt text, keyboard usable, target sentuh min 44 px |
| Compatibility | Browser modern desktop/mobile; PWA shell; jaringan seluler sedang |
| Observability | Error log callable, latency, kegagalan Maps, audit events, dashboard kesehatan integrasi |
| Backup | Backup Firestore terjadwal dan uji restore; backup media penting |
| Maintainability | Domain logic terpisah dari UI; typed contracts; dokumentasi kontrak dan migrasi data |

## 13. Security, Fraud, dan Privacy Controls

1. Semua nilai harga, promo, ongkir, stok, dan status pembayaran ditentukan/divalidasi backend.
2. Owner/staff permissions diperiksa kembali dalam setiap callable; route guard frontend hanya lapisan UX.
3. Terapkan Firebase App Check pada layanan yang didukung setelah validasi staging. Untuk integrasi web baru, evaluasi provider reCAPTCHA Enterprise yang didukung saat ini oleh Firebase App Check.
4. Simpan secret Routes API di Secret Manager; jangan taruh server key di bundle frontend atau file `.env` yang tercommit.
5. Browser key untuk Maps, bila digunakan, dibatasi HTTP referrer dan API yang diizinkan.
6. Gunakan budget alert, quota, rate limit, dan logging agregat untuk pemanggilan Maps.
7. Alamat dan koordinat pelanggan tidak boleh dimasukkan ke log umum atau analytics event yang dapat diakses luas.
8. Buat audit log untuk override biaya, perubahan tarif/zona, pembayaran, stok, promo, akses, dan refund.
9. Siapkan prosedur incident response, backup, dan rotasi secret.

## 14. Acceptance Criteria Rilis

Rilis v2 tidak boleh dinyatakan siap hanya karena tampilan sudah selesai. Kriteria minimum:

- [ ] Zona gratis diuji dengan koordinat contoh yang disetujui owner di Pasar Bahagia dan Kisaran Kuala Dua.
- [ ] Rute di luar zona menggunakan rute kendaraan; tidak ada fallback garis lurus.
- [ ] Manipulasi client terhadap harga, ongkir, kupon, status bayar, dan stok ditolak backend.
- [ ] Order, pembayaran, dan stok lulus pengujian concurrency/idempotency.
- [ ] Aturan Firestore/Storage diuji di Emulator Suite.
- [ ] Semua callable memiliki test untuk role invalid, payload invalid, retry, dan kegagalan eksternal.
- [ ] Pengujian responsive pada ponsel kecil, tablet, dan desktop.
- [ ] Pengujian reduced-motion, keyboard, label form, dan kontras dasar.
- [ ] Audit dependency dan bundle diulang pada Node/runtime yang didukung.
- [ ] Backup dan prosedur restore diuji.
- [ ] Secret dan Git history ditinjau; archive bersih tidak berisi `.env.local`, `.cenv.local`, `.git`, `node_modules`, atau emulator data.
- [ ] Owner menyetujui titik toko, zona, tarif, jam layanan, menu/harga, metode pembayaran, dan aturan pembatalan.

## 15. Keputusan Owner yang Masih Diperlukan

| Keputusan | Data yang diperlukan | Dampak jika belum ada |
|---|---|---|
| Titik toko | Link Google Maps/pin koordinat yang benar | Rute dan jarak belum dapat dihitung |
| Zona gratis Pasar Bahagia | Batas poligon/peta yang disepakati | Sistem belum bisa memutuskan gratis secara otomatis |
| Zona gratis Kisaran Kuala Dua | Batas cakupan yang disepakati | Nama wilayah tidak cukup sebagai batas teknis |
| Tarif di luar zona | Base fee, tarif/km atau tabel jarak, minimum, pembulatan | Checkout belum boleh menampilkan ongkir otomatis final |
| Batas layanan | Maksimal jarak, jam/hari pengantaran | Sistem belum tahu kapan menolak/konfirmasi manual |
| Kapasitas produksi | Cut-off pre-order, jadwal, lead time | Slot pemenuhan belum dapat dijanjikan otomatis |
| Kebijakan stok | Reservasi saat order/payment/preparation; release saat cancel | Risiko double booking/stock deduction |
| Pembayaran | Transfer/QRIS, rekening/merchant, format bukti, SLA verifikasi | Status pembayaran tetap manual dan terbatas |
| Pembatalan/refund | Batas waktu, alasan, cara pengembalian | Refund tidak boleh otomatis |
| Data pelanggan | Apakah akun wajib/opsional, consent, retensi | Fitur customer account harus tetap opsional |
| Media dan konten | Foto produk asli, video, harga final, deskripsi | Hindari visual/harga yang tidak akurat |

## 16. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Zona gratis salah batas | Poligon disetujui owner, uji titik dalam/luar/dekat batas |
| Ongkir tidak sesuai kenyataan | Gunakan rute kendaraan, tarif owner, override beralasan |
| Biaya Maps tidak terkendali | Field mask minimal, quota/budget alert, quote reuse dan rate limit |
| Manipulasi harga/discount | Harga dan promo dihitung ulang di backend |
| Stok terjual melebihi stok | Reservasi atomik dan tes concurrency |
| Secret terekspos di archive/Git | Audit file/riwayat, rotate private secret, release allowlist |
| Foto produk tidak sesuai | Gunakan foto asli; label gambar ilustrasi jika belum tersedia |
| HPP tidak valid | Versioned recipe/cost input dan review owner sebelum margin report |
| Dashboard terlalu rumit | Prioritaskan tindakan operasional, progressive disclosure, uji usability |
| Ketergantungan owner tunggal | Role staf terbatas dengan audit dan prosedur approval |

## 17. Strategi Rilis

1. **Development:** implementasi feature branch dan test unit/domain.
2. **Staging:** Firebase project terpisah, Maps key terpisah, data dummy, tanpa data pelanggan nyata.
3. **Pilot internal:** owner menguji order pickup/delivery, POS, produksi, zona gratis, dan rute berbayar.
4. **Soft launch:** aktifkan sebagian pelanggan/area bila owner siap; pantau error, latency, dan komplain ongkir.
5. **General release:** hanya setelah semua gerbang rilis dan owner sign-off terpenuhi.
6. **Post-launch:** review metrik mingguan dan backlog berdasarkan data nyata.

## 18. Referensi Teknis

- Source project KudapKita yang diunggah pengguna, termasuk source React/TypeScript, Firebase Functions, rules, dan dokumentasi project.
- Google Maps Routes API `computeRoutes`: https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
- Google Maps Routes API field masks: https://developers.google.com/maps/documentation/routes/choose_fields
- Google Maps Routes API setup: https://developers.google.com/maps/documentation/routes/get-api-key
- Firebase Cloud Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firebase App Check: https://firebase.google.com/docs/app-check

---

**Dokumen ini merupakan baseline produk dan rencana target. Fitur berlabel [PENGEMBANGAN] belum dianggap terimplementasi sampai kode, konfigurasi, pengujian, dan release gate terkait selesai.**
