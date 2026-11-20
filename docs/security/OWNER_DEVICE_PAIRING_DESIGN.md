# Rancangan Keamanan Owner Device Pairing via QR

**Status: rancangan, belum diimplementasikan atau diaktifkan.** QR pairing adalah fitur autentikasi/otorisasi baru. Jangan mengganti login Owner yang sekarang sebelum seluruh alur ini dibangun dan diuji.

## Tujuan

Mengizinkan Owner yang sudah login pada perangkat utama memasangkan HP sebagai perangkat Owner baru tanpa menaruh password atau kredensial permanen di QR.

## Alur yang disyaratkan

1. Owner login di perangkat utama dengan Firebase Email/Password. Backend memeriksa `userProfiles/{uid}` memiliki `role = owner` dan `isActive = true`.
2. Perangkat utama meminta challenge pairing melalui Callable Function. Server membuat token acak kriptografis minimal 256-bit, menyimpan hash token (bukan token mentah), serta waktu kedaluwarsa singkat, misalnya 120 detik.
3. QR berisi URL origin aplikasi yang diizinkan dengan token opaque pada URL fragment (`#token=...`). Jangan gunakan layanan QR pihak ketiga yang menerima token pairing sebagai parameter gambar.
4. HP membuka route pairing, meminta pemindaian kamera (izin kamera harus eksplisit), membaca token dari fragment, lalu meminta persetujuan. Token harus segera dihapus dari URL/history setelah diproses.
5. Perangkat utama menampilkan identitas perangkat yang meminta akses dan harus menekan **Setujui** secara eksplisit. Tidak ada auto-approve.
6. Setelah disetujui, HP menukar token sekali pakai melalui Callable Function. Server memverifikasi hash, status, pemilik, waktu kedaluwarsa, dan bahwa challenge belum digunakan.
7. Server membuat `ownerDevices/{uid}/devices/{deviceId}` dengan status aktif, lalu membuat Firebase custom token untuk UID Owner yang sama dengan custom claim `ownerDeviceId`.
8. HP melakukan `signInWithCustomToken`. Semua Callable Function Owner dan Firestore Rules harus memeriksa status device untuk token yang memiliki claim `ownerDeviceId`.
9. Owner dapat melihat perangkat aktif, label perangkat, waktu dibuat/terakhir aktif, dan mencabut perangkat. Setelah revoked, Callable Functions dan Firestore Rules harus menolak operasi dari device tersebut.

## Data model konseptual

### `ownerPairings/{challengeId}` — server-only

- `ownerUid`
- `tokenHash`
- `status`: `CREATED | REQUESTED | APPROVED | CONSUMED | EXPIRED | REJECTED`
- `createdAt`, `expiresAt`
- `requestedAt`, `approvedAt`, `consumedAt`
- `requestedDeviceLabel` (dibatasi panjang dan divalidasi)

### `ownerDevices/{uid}/devices/{deviceId}` — server-managed

- `deviceId`
- `label` (opsional, ditetapkan/dirapikan Owner)
- `status`: `ACTIVE | REVOKED`
- `createdAt`, `lastSeenAt`, `revokedAt`
- `authMethod`: `QR_PAIRING`

Dokumen challenge dan perangkat tidak boleh dapat dibuat atau diubah oleh browser secara langsung. Semua perubahan harus melalui Admin SDK di Callable Functions.

## Kontrol keamanan wajib

- HTTPS dan origin allowlist; tolak localhost/IP/hostname tak dikenal saat aplikasi sudah dipublikasikan.
- Token pairing kriptografis, hash disimpan server, masa berlaku singkat, sekali pakai, dan terikat ke UID Owner pembuat challenge.
- Persetujuan Owner diperlukan setelah HP meminta pairing.
- Batasi percobaan, jumlah challenge aktif, dan jumlah perangkat; App Check untuk callable yang relevan.
- Jangan menyimpan password, refresh token, API key, atau custom token di QR.
- Jangan mengirim token ke analytics, log, query string, atau layanan QR eksternal.
- Jangan percaya `role` atau `deviceId` dari payload browser. Ambil role dan status device dari server.
- `requireOwner` perlu memeriksa device record untuk custom claim `ownerDeviceId`.
- Firestore Rules `isOwner()` perlu menolak token QR jika device tidak aktif. Semua koleksi Owner harus tetap default-deny bila pemeriksaan device gagal.
- Revocation harus efektif pada Callable Functions dan Firestore Rules, bukan hanya menghapus device dari daftar UI.
- Jangan mengubah/mengganti sesi email/password desktop yang telah ada tanpa strategi migrasi dan pengujian yang jelas.

## UI yang direkomendasikan

Di Pengaturan Owner:
- **Hubungkan HP**: buat QR dengan countdown 2 menit.
- **Permintaan perangkat**: tampilkan nama label perangkat dan tombol Setujui/Tolak.
- **Perangkat terhubung**: daftar perangkat, waktu terakhir aktif, dan tombol Cabut akses.
- QR kadaluarsa menghasilkan tombol Buat QR baru.
- HP menampilkan status Menunggu persetujuan, Berhasil, Ditolak, atau Kedaluwarsa.
- Bila kamera tidak tersedia, jangan melemahkan keamanan dengan kode permanen; gunakan metode pairing alternatif sekali pakai yang setara dan disetujui Owner.

## Pengujian sebelum rilis

- QR kedaluwarsa, dipakai dua kali, token salah, token diubah, dan token dari Owner lain.
- User non-owner/inactive Owner tidak dapat membuat challenge atau menyetujui pairing.
- HP baru tidak memperoleh sesi sebelum persetujuan eksplisit.
- Dua HP tidak dapat memakai challenge yang sama.
- Revoke harus memutus akses pada callable dan baca/tulis Firestore untuk sesi perangkat itu.
- Uji reload, jaringan terputus, kamera ditolak, dan waktu perangkat berbeda.
- Pastikan tidak ada token dalam logs, analytics, referer, error monitoring, atau screenshot diagnostik.
- Uji semua skenario di Firebase Emulator/staging sebelum rilis.

## Yang belum tersedia di source sekarang

Source KudapKita saat ini belum memiliki callable pairing, model `ownerDevices`, token custom device claim, UI scan kamera, ataupun kontrol revocation. Dokumen ini adalah spesifikasi implementasi berikutnya, bukan klaim bahwa QR pairing sudah bekerja.
