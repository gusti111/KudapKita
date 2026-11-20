# Roadmap Teknis KudapKita v2.0
## Rencana implementasi berbasis source code saat ini

**Versi:** 2.0  
**Tanggal:** 16 November 2026  
**Status:** Draft eksekusi untuk validasi owner  
**Arah:** Integrated Business Platform  
**Urutan prioritas:** Delivery → Operations → Marketing → Customer → Analytics

> Roadmap menggunakan fase dan gerbang penerimaan, bukan estimasi tanggal yang belum didukung kapasitas tim. Fase dapat dipecah menjadi beberapa sprint. Jangan lanjut ke produksi jika exit criteria fase belum terpenuhi.

## 1. Prinsip Implementasi

1. **Tidak rewrite:** pertahankan React + TypeScript + Vite + Firebase yang sudah digunakan.
2. **Backend is the authority:** harga, ongkir, kupon, stok, status pembayaran, dan transisi order divalidasi di Firebase Callable Functions.
3. **Pecah per domain:** tambah modul pada `areas/storefront`, `areas/owner`, `domain`, `data`, dan `infrastructure`; hindari business logic di komponen UI.
4. **Migrasi bertahap:** data existing harus tetap dapat dibaca; gunakan versi schema dan backfill idempotent.
5. **Test sebelum deploy:** jalankan typecheck, build, unit/callable tests, rules emulator, dan staging end-to-end.
6. **Rahasia tetap rahasia:** jangan ikutkan environment lokal, `.git`, service account, atau emulator data ke arsip distribusi.

## 2. Peta Source Existing ke Area Perubahan

| Area source | Fungsi saat ini | Tindakan v2 |
|---|---|---|
| `apps/web/src/app/router.tsx` | Routing customer dan owner | Tambah route delivery settings, campaign, customer, laporan baru secara terstruktur |
| `apps/web/src/areas/storefront` | Beranda, katalog, keranjang, checkout, order tracking | Map picker, quote delivery, promo display, account/history, campaign data dinamis |
| `apps/web/src/areas/owner` | Halaman dashboard owner, produk, kategori, pesanan, produksi, stok, POS, laporan, settings | Pisah halaman monolitik, tambah delivery manager, campaign manager, customer, production board |
| `apps/web/src/domain` | Entitas/aturan bisnis | Tambah tipe DeliveryZone, DeliveryQuote, Campaign, Promotion, Customer, Reservation |
| `apps/web/src/data` | Akses repository data | Tambah repository sesuai domain dan public/private projections |
| `apps/web/src/infrastructure` | Integrasi Firebase dan service | Maps/Places client terbatas, analytics adapter, media handling, error reporting |
| `functions/src/index.js` | Callable transaksi yang ada | Callable delivery quote, campaign/promo, waste, reservation, customer history |
| `functions/src/domain.js` | Validasi domain backend | Validasi tarif, quote, promo, role, stok, status, idempotency |
| Firestore/Storage rules | Proteksi database dan media | Rules untuk campaign, quote, customer, promo, audit; test emulator |
| `firestore.indexes.json` | Index query existing | Tambah index berdasar query baru; jangan menambah index tanpa query |
| `docs/` | Dokumentasi sistem | Perbarui overview, schema, callable contract, rules, release/deployment docs |

Catatan: `OwnerOperationsPages.tsx` saat ini menggabungkan banyak operasi owner dalam satu file besar. Pecah menjadi halaman/feature modules sebelum penambahan kompleksitas agar testing dan maintenance lebih mudah.

## 3. Fase 0 — Stabilitas, Keamanan, dan Baseline

### Pekerjaan teknis

- Buat arsip release dari allowlist source; singkirkan `.env.local`, `.cenv.local`, `.git`, `node_modules`, `dist`, emulator data, dan service-account files.
- Tinjau arsip awal serta Git history untuk private credentials. Rotasi private token/key bila benar-benar terekspos; bedakan Firebase web config dari private server credentials.
- Cocokkan `SYSTEM_OVERVIEW.md`, Firestore schema, role/routes, callable contract, dan deployment docs dengan implementasi source.
- Gunakan Node.js 24.12+ untuk frontend seperti deklarasi `package.json`; gunakan runtime Functions sesuai konfigurasi project.
- Jalankan `npm ci`, `npm run typecheck`, `npm run build`, `npm --prefix functions run check`, `npm --prefix functions test`, dan Rules Emulator tests.
- Ulangi `npm audit` dan audit dependency production. Hindari `npm audit fix --force` sebelum analisis kompatibilitas.
- Ukur bundle dan identifikasi route/vendor berat; buat baseline Lighthouse/performance.
- Siapkan Firebase staging project terpisah dari produksi dan Maps project/key khusus staging.

### Output

- Laporan security/credential review.
- Build/test baseline yang dapat diulang.
- Daftar dependency yang perlu ditangani.
- Baseline bundle dan performance.
- Environment staging terdokumentasi.
- Daftar keputusan owner (titik toko, zona, tarif, pembayaran, stok, kebijakan).

### Exit criteria

Tidak ada secret lokal dalam artefak distribusi; semua hasil test tersedia; konfigurasi produksi tidak berubah; keputusan bisnis penting sudah memiliki owner/pemilik keputusan.

## 4. Fase 1 — Delivery Foundation dan Checkout Transparan [Prioritas P0]

### Frontend

- Tambah tipe domain `DeliveryAddress`, `DeliveryZone`, `DeliveryQuote`, `DeliverySettings`.
- Buat komponen `AddressAutocomplete`, `DeliveryMapPicker`, `DeliveryQuoteSummary`, dan `DeliveryStateMessage`.
- Gunakan Places Autocomplete (New) untuk pencarian alamat; pengguna harus mengonfirmasi hasil dan pin. Jangan mengandalkan input teks bebas sebagai satu-satunya koordinat.
- Buat state: idle, searching, selected, quote-loading, free-zone, paid-quote, outside-service-area, route-unavailable, manual-confirmation, expired, error.
- Tampilkan jarak rute dan durasi sebagai estimasi, rincian ongkir, total, dan waktu berlaku quote.
- Pertahankan cart saat pengguna mengganti pickup/delivery atau ketika Maps gagal.

### Backend

- Tambah `deliverySettings/current` dan koleksi `deliveryZones/{zoneId}` dengan versi aktif.
- Implementasi callable `calculateDeliveryQuote` pada region existing `asia-southeast2`.
- Validasi auth (guest anonymous/customer), koordinat, origin aktif, service hours, radius maksimum, versi zona, dan throttling.
- Jalankan point-in-polygon pada backend untuk zona Pasar Bahagia dan area Kisaran Kuala Dua yang disetujui owner.
- Untuk lokasi di luar zona gratis, panggil Google Routes API `computeRoutes` dengan `travelMode: DRIVE`; gunakan field mask minimal misalnya `routes.distanceMeters,routes.duration`.
- Hitung biaya di backend berdasarkan tarif aktif. Simpan rupiah sebagai integer.
- Simpan quote dengan UID, hash koordinat tujuan, versi tarif/zona, jarak/durasi, fee, status, `expiresAt`.
- Ubah `createOnlineOrder`: jika delivery, order wajib menyertakan `quoteId` yang valid; backend memeriksa UID, expiry, destination hash, tariff version, dan status.
- Buat `ownerOverrideDeliveryQuote` dengan alasan wajib dan audit trail.
- Jangan panggil Maps API di dalam callback Firestore transaction. Simpan quote lebih dulu; transaksi order berikutnya validasi quote agar retry transaksi tidak memanggil Routes berulang.

### Keamanan dan biaya Maps

- Server Routes API key disimpan di Firebase Functions Secret Manager.
- Browser key (jika diperlukan untuk map rendering) terpisah, dibatasi HTTP referrer dan API.
- Pakai field mask, session token autocomplete bila relevan, quota dan billing alert.
- Jangan log alamat lengkap atau koordinat secara bebas.
- Terapkan cache quote jangka pendek berdasarkan UID/destination/tariff version dengan TTL yang disepakati.
- Jika API gagal atau rute tidak ditemukan: manual confirmation atau pickup; jangan gunakan jarak garis lurus.

### Pengujian

- Titik dalam/luar/dekat batas poligon kedua zona gratis.
- Koordinat invalid/swapped, alamat tanpa hasil terpilih, origin tidak aktif.
- Rute DRIVE normal, rute panjang, no route, timeout, quota/billing error.
- Quote expired, UID berbeda, koordinat berubah, versi tarif berubah, replay quote.
- Tampering ongkir/distance/zone dari browser.
- Manual override dan audit log.
- Checkout pickup tidak meminta quote delivery.

### Output dan gerbang

Map picker, server-side zone/route quote, pengaturan tarif/zona owner, checkout breakdown, quote snapshot pada order. Owner harus menguji sample alamat nyata di tiap zona gratis dan beberapa lokasi berbayar sebelum fase dianggap selesai.

## 5. Fase 2 — Order Operations, Production, Stock, POS [P0/P1]

### Order inbox

- Tambah filter status pesanan, pembayaran, pemenuhan, tanggal, slot, dan exception pengantaran.
- Detail order menampilkan snapshot produk, total, diskon, quote, alamat yang dibatasi aksesnya, dan timeline.
- Tambah `orderStatusHistory` immutable; setiap callable status menulis histori.
- Validasi transisi di backend, bukan sekadar disabled button frontend.

### Production board

- Agregasi item pada order yang memenuhi syarat berdasarkan tanggal pemenuhan.
- Tampilkan demand, target, output actual, dan shortage.
- Gunakan `recordProduction` existing; pastikan hasil produksi dan stock movements atomik.
- Jika kapasitas/slot pemenuhan belum tersedia, jangan tampilkan slot otomatis sebagai janji.

### Kebijakan persediaan

- Konfirmasi dengan owner kapan stok di-reserve: saat order dibuat, pembayaran diverifikasi, atau mulai preparation.
- Rekomendasi: `onHandQty`, `reservedQty`, `availableQty`; reserve setelah pembayaran tervalidasi, consume saat preparation, release pada cancellation yang sah.
- Buat callable reserve/release/consume dengan idempotency dan transaction.
- Migrasi dokumen lama dengan `reservedQty=0` menggunakan script idempotent dan dry-run.
- Catat adjustment/waste reason, before/after qty, actor, timestamp, dan order/production reference.

### POS multi-item

- Ubah UI single-line di owner menjadi cart lines.
- Reuse `createDirectSale` existing yang menerima array item.
- Backend recompute canonical price, validate stock, create sale and stock movements atomically.
- Tambah receipt/nota print-friendly sebagai tahap awal; integrasi printer khusus dapat menyusul.

### Output dan gerbang

Order inbox lengkap, production board, multi-item POS, stock policy, audit history. Test concurrency harus membuktikan stok tidak negatif dan transaksi tidak terduplikasi.

## 6. Fase 3 — Marketing dan Content Management [P1]

### Campaign CMS

- Tambah owner route `/owner/marketing` atau `/owner/campaigns` sesuai konvensi router.
- Data private `campaigns` dan public projection `publicCampaigns`.
- Field: title, eyebrow, description, mediaType, mediaPath, posterPath, altText, CTA, route, sortOrder, status, startAt, endAt, author, publishedAt.
- Pindahkan data hard-coded dari `CampaignCarousel` ke repository public campaign.
- Upload gambar/video via Storage; rules owner-only, MIME/size limit.
- Video lazy loaded, muted, poster fallback, tanpa audio autoplay.
- Campaign bisa draft, scheduled, active, paused, expired, archived.

### Promo dan bundle

- Tambah `promotions` dan `promotionRedemptions`.
- Backend menghitung diskon dan redemption atomik.
- Field aturan: fixed/percentage, eligible product/category, min spend, start/end, global/per-customer limit, stacking.
- Bundle fixed dan mix-and-match; harga final owner-defined dan validated backend.
- Tambah preview campaign/promo dan test boundary (tanggal mulai/berakhir, kuota terakhir, promo double use).

### Output dan gerbang

Owner dapat publish/pause campaign tanpa deployment; storefront hanya menampilkan data public yang aktif; video tidak menurunkan performa mobile; discount tampering dan double redemption ditolak.

## 7. Fase 4 — Customer Accounts dan Retention [P1]

- Pertahankan guest checkout.
- Tambah login/register opsional untuk riwayat lintas device.
- Rancang account linking dari Firebase Anonymous Auth secara aman agar guest order tidak hilang atau diambil pengguna lain.
- Tambah `customerProfiles`, saved addresses (optional), order history, reorder, dan review untuk order completed.
- Reorder selalu memakai harga/ketersediaan terbaru; jangan menyalin total lama sebagai total baru.
- Tambah consent untuk komunikasi marketing; preferensi opt-out harus dihormati.
- Siapkan account/data deletion flow dan retensi dokumen transaksi.

### Output dan gerbang

Customer account, profile, history, secure order access, reorder, review/consent. Uji akses lintas akun dan linking guest-to-account, termasuk kasus UID sudah terhubung ke akun lain.

## 8. Fase 5 — Analytics dan Laporan [P1]

- Definisikan event & KPI sebelum membuat chart.
- Buat report query berdasar date range, order channel, status, product/category, fulfillment type.
- Pisahkan order value, collected payment, refund, discount, billed delivery fee, direct sales, dan unpaid orders.
- Tambahkan CSV export sesuai filter.
- Buat operational metrics: order by status, confirmation time, fulfillment time, production gap, low stock, waste, delivery route exceptions.
- Tambah gross margin hanya setelah HPP/resipe tervalidasi; tambahkan operating expenses sebelum menyebut net profit.
- Pastikan query dibatasi tanggal dan paginated; pertimbangkan materialized daily summaries ketika volume telah membenarkan.

### Output dan gerbang

Laporan dapat direkonsiliasi dengan dokumen pembayaran dan direct sales; tidak ada order unpaid/cancelled dihitung sebagai kas masuk; metrik dan formula terdokumentasi.

## 9. Fase 6 — Security, Performance, Accessibility, Launch Readiness [P0 Release Gate]

- Terapkan App Check enforcement bertahap setelah staging test; validasi layanan yang digunakan.
- Review Firestore dan Storage rules untuk semua koleksi/proyeksi baru.
- Pastikan role checks selalu dijalankan di callable; siapkan role owner/cashier/production/marketing bila diaktifkan.
- Tambah audit log untuk aksi sensitif dan alert error callable.
- Pecah route chunks; optimasi gambar WebP/AVIF, lazy loading, video poster, caching yang tepat.
- Lakukan responsive QA 360 px/390 px/tablet/desktop, keyboard/focus, screen reader labels, kontras WCAG AA, reduced motion.
- Jalankan dependency audit dan regression; tidak menggunakan force downgrade untuk menyembunyikan audit finding.
- Test backup/restore dan prosedur rotasi secret.
- Pastikan staging, production, Maps keys dan Firebase project tidak tertukar.

### Release gate

Semua unit, integration, rules emulator, callable, delivery route, payment/stock concurrency, responsive, security, backup, dan owner acceptance test lulus. Owner telah menandatangani keputusan bisnis yang relevan.

## 10. Fase 7 — Pengembangan Lanjutan [P2]

- Raw material inventory, recipe/BOM, yield produksi, biaya kemasan/tenaga/overhead.
- HPP otomatis dengan versioned recipes dan histori biaya.
- Waste analytics dan reorder point bahan.
- Loyalty points, referral, dan segmentasi pelanggan setelah consent dan aturan bisnis siap.
- Integrasi payment gateway jika volume dan proses rekonsiliasi memerlukannya.
- Notifikasi otomatis yang punya consent/templating dan monitoring.
- Advanced analytics/cohort ketika data transaksi cukup.

## 11. Urutan Pull Request dan Definition of Done

Setiap PR idealnya memperkenalkan satu irisan vertikal yang dapat dites:

1. Domain type + validation.
2. Firestore schema/rules/indexes atau callable contract bila dibutuhkan.
3. Backend callable + test.
4. Repository/service frontend.
5. UI state: loading, empty, error, success, permission denied.
6. Dokumentasi dan migration/backfill.
7. QA checklist dan bukti staging.

**Definition of Done:** tidak ada perubahan yang hanya menyelesaikan tampilan. Fitur dianggap selesai jika validasi backend, rules, error state, audit/event, accessibility, test, dokumentasi, dan acceptance criteria terkait telah terpenuhi.

## 12. Daftar Pengujian Wajib

| Area | Kasus minimum |
|---|---|
| Delivery | In/out polygon, rute normal/no route, timeout/quota, quote expired, UID mismatch, destination tamper, rate version mismatch |
| Checkout | Pickup vs delivery, cart empty, stock changed, product inactive, duplicate submit, discount/fee tamper |
| Payment | Unauthorized verify, duplicate verify, reject/retry, refund policy, order/payment mismatch |
| Inventory | Two buyers compete for last stock, reserve/consume/release duplicate, production adjustment, negative stock |
| POS | Multiple item, item removed/inactive, insufficient stock, idempotent retry |
| Marketing | Scheduled/expired campaign, media invalid/oversized, coupon cap, per-user cap, expired coupon, stacking |
| Customer | Guest checkout, linking, cross-user data access, reorder price refresh, account deletion |
| Analytics | Date boundary/timezone, unpaid exclusion, refund handling, POS reconciliation, export filters |
| Security | No role, inactive user, direct Firestore write denial, Storage access, callable App Check behavior, abuse/rate limits |
| UI | Mobile viewport, keyboard, labels, contrast, reduced motion, slow network, image/video fallback |

## 13. Owner Decision Register

Keputusan yang harus tersedia sebelum konfigurasi produksi:

- Titik asal toko (Google Maps link/pin).
- Polygon Pasar Bahagia dan batas cakupan Kisaran Kuala Dua.
- Tarif ongkir (skema, base fee, rate/km/tabel, minimum, pembulatan, jarak maksimum).
- Jam/hari delivery, lead time, cut-off pre-order, slot pickup.
- Kebijakan reservasi dan pembatalan stok.
- Prosedur transfer/QRIS dan verifikasi pembayaran.
- Kebijakan pembatalan, refund, dan biaya pengantaran gagal.
- Harga, foto, deskripsi, stok, jadwal produk, serta HPP yang valid.
- Aturan diskon, bundle, coupon, stacking, dan kuota.
- Apakah akun pelanggan opsional dan bagaimana consent marketing dicatat.

## 14. Referensi Teknis

- Google Routes API: https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes
- Google Routes API field masks: https://developers.google.com/maps/documentation/routes/choose_fields
- Firebase Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firebase App Check: https://firebase.google.com/docs/app-check
- Source project dan dokumentasi KudapKita yang diberikan owner.
