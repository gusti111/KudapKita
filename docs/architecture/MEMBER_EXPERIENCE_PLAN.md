# Rencana Pengalaman Guest dan Member KudapKita

**Status: rancangan produk, belum menjadi fitur aktif.**

## Kondisi saat ini

- Visitor dapat membaca katalog publik dan menggunakan keranjang lokal pada browser.
- Customer checkout menggunakan Firebase Anonymous Authentication saat mengirim checkout.
- Guest hanya dapat membaca order yang UID-nya cocok dengan sesi anonim; pelacakan lintas browser/perangkat belum tersedia.
- Source role saat ini hanya mendefinisikan `owner`. Belum ada registrasi/login member, profil member, riwayat pesanan akun, langganan, entitlement, maupun payment webhook.

## Segmentasi pengalaman

### Guest / pengunjung

- Beranda dan katalog publik.
- Cari, filter, sortir, detail produk.
- Keranjang browser lokal.
- Checkout guest dan tracking sesuai batas sesi anonim yang sudah ada.
- CTA member harus informatif, tidak memaksa registrasi sebelum pengguna memerlukan fitur akun.

### Member / akun pelanggan

Pengalaman member yang direncanakan:
- Dashboard akun dengan identitas member yang jelas.
- Riwayat pesanan lintas perangkat setelah akun dibuat.
- Detail pesanan dan status aktual.
- Pesan ulang dengan harga, ketersediaan, dan jadwal yang selalu divalidasi ulang dari katalog aktif; jangan menyalin harga/order lama sebagai harga baru.
- Profil dan preferensi komunikasi.
- Halaman langganan yang menunjukkan paket, manfaat, status, periode aktif, tanggal berakhir/perpanjangan, dan riwayat pembayaran jika model pembayaran tersedia.
- Akses fitur premium hanya ketika entitlement aktif menurut backend.

### Owner

- Workspace Owner tetap menjadi surface internal terpisah.
- Akses Owner tidak boleh disamakan dengan Member. Status langganan tidak pernah memberikan role Owner.
- Owner mengelola katalog, pesanan, produksi, persediaan, penjualan, laporan, pengaturan toko, dan akses perangkat.

## Data dan entitlement yang direkomendasikan

Jangan memberikan status premium hanya karena pengguna berhasil login. Login membuktikan identitas akun, bukan pembayaran atau entitlement.

Model konseptual yang disarankan:
- `customerProfiles/{uid}`: identitas dan preferensi non-sensitif yang boleh dibaca pemilik akun.
- `memberSubscriptions/{subscriptionId}`: `uid`, `planId`, status, periode mulai/akhir, payment reference, timestamps.
- Subscription state dikelola server/webhook tepercaya atau proses verifikasi Owner yang tercatat; klien tidak boleh mengubah `status`, `planId`, `expiresAt`, `paidAt`, atau entitlement.
- Status yang diperlukan minimal membedakan `PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, dan `EXPIRED`.
- Entitlement dihitung server-side dari status dan masa berlaku; gunakan prinsip deny-by-default.
- Semua paket, benefit, harga, periode, dan kebijakan perpanjangan harus diisi setelah keputusan bisnis Owner. Jangan mengarang detail tersebut di UI.

## Urutan implementasi

1. Tentukan tujuan membership dan benefit yang benar-benar akan diterima.
2. Putuskan paket, harga, masa aktif, aturan perpanjangan, pembatalan, refund, dan penanganan gagal bayar.
3. Pilih metode pembayaran/provider dan siapkan mekanisme verifikasi server-side/webhook. Jangan mempercayai redirect sukses dari browser sebagai bukti pembayaran.
4. Tambahkan Firebase Email/Password member auth dan provisioning `customerProfiles` melalui backend.
5. Migrasikan alur checkout dengan menjaga kompatibilitas guest yang sudah berjalan; uji order ownership untuk anonymous dan authenticated customer.
6. Tambahkan member routes, guard, dashboard, riwayat, dan halaman subscription.
7. Tambahkan subscription entitlement ke Callable Functions dan Firestore Rules.
8. Uji owner, guest, member tanpa subscription, member aktif, expired, cancelled, dan pembayaran pending.
9. Uji staging dan kebijakan privasi/retensi sebelum rilis.

## Arahan UI

- Guest: storefront bersih dan ringan, fokus ke katalog serta checkout.
- Member aktif: area akun yang lebih personal, navigasi akun, riwayat, status membership, dan fitur yang benar-benar aktif.
- Member nonaktif/expired: akun dan riwayat tetap dapat diakses, tetapi fitur premium dibatasi; tampilkan status dan cara melanjutkan secara transparan.
- Premium visual adalah diferensiasi layanan, bukan alasan untuk menyembunyikan biaya atau mengganggu pembatalan.
- Gunakan palet Warm Modern Artisanal yang sudah ada agar identitas KudapKita tetap konsisten.

## Batas implementasi saat audit ini

Tidak ada rute atau data member yang ditambahkan ke aplikasi aktif, karena belum ada keputusan benefit/harga, auth flow, payment provider, atau aturan entitlement. Menggambar badge premium tanpa validasi backend akan menyesatkan dan tidak aman.
