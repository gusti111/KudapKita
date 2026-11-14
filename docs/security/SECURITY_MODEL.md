# Security Model — KudapKita MVP

## Identitas dan peran

- Visitor tidak perlu login untuk membaca katalog yang dipublikasikan.
- Customer memakai Firebase Anonymous Authentication ketika mengirim checkout.
- Owner memakai Email/Password dan wajib memiliki `userProfiles/{uid}` dengan `role: owner` serta `isActive: true`.
- Dokumen profile/role owner dibuat manual melalui Firebase Console, bukan dari browser.
- Akses operasional hanya owner pada MVP. Role cashier/manager belum diaktifkan.

## Access matrix

| Resource | Visitor | Guest customer | Owner |
|---|---:|---:|---:|
| `publicProducts` published | Read | Read | Read/write |
| `publicCategories` active | Read | Read | Read/write |
| `publicSettings/storefront` | Get | Get | Read/write |
| `products`, `categories` | Deny | Deny | Read/write, soft archive |
| `orders` create | Deny | Initial request only | Read |
| `orders` get | Deny | Own UID only | Read |
| `orders` list | Deny | Deny | Read |
| `orders` update | Deny | Deny | State transitions only |
| `payments` | Deny | Deny | Create verified record, read |
| `inventory` | Deny | Deny | Read/create/update |
| `stockMovements`, `productionRuns` | Deny | Deny | Read/create, append-only |
| `directSales` | Deny | Deny | Read/create, append-only |
| `privateSettings` | Deny | Deny | Read/write |
| `activityLogs` | Deny | Deny | Read/create |

## Guardrails

- Deny-by-default untuk koleksi yang tidak disebutkan.
- Public projection adalah whitelist eksplisit; HPP tidak boleh ada pada `publicProducts`.
- Customer hanya dapat membuat status awal `REQUESTED` + `UNPAID`, dengan `createdByUid` sama dengan UID anonim.
- Customer tidak dapat melakukan list order, mengubah status, atau membaca pesanan milik UID lain.
- Owner order update dibatasi pada konfirmasi total, verifikasi pembayaran, dan transisi state yang diizinkan.
- Payments dan histori stock/production/direct sales tidak dapat diubah atau dihapus melalui Rules setelah dibuat.
- Route guard React hanyalah UX. Firestore Rules tetap menjadi batas otorisasi server.
- Jangan gunakan wildcard permissive seperti `allow read, write: if true`.

## Keterbatasan penting tanpa trusted backend

KudapKita MVP tidak memakai Cloud Functions. Operasi stok dan pencatatan transaksi dijalankan melalui Firestore transactions dari klien owner. Ini memberi atomicity untuk alur aplikasi yang benar, tetapi tidak melindungi dari owner yang sengaja menulis nilai lain melalui SDK/Console. Client-side state machine dan Firestore Rules mengurangi risiko perubahan biasa, namun belum setara backend tepercaya.

Tidak tersedia:
- payment gateway / webhook;
- unggah bukti pembayaran pelanggan ke Firebase Storage;
- idempotency dan anti-spam backend;
- jadwal pembatalan order otomatis;
- audit log tamper-proof;
- multi-role staff.

Owner wajib memeriksa harga, ketersediaan, jadwal, delivery fee, serta transaksi aktual secara manual. Sebelum otomatisasi pembayaran, reservasi stok multi-customer, atau operasi staf, evaluasi Cloud Functions/Cloud Run dan billing terpisah.

## Deployment prerequisites

1. Verifikasi Firebase project ID dan backup data.
2. Deploy Rules dan indexes hanya setelah Rules Emulator/Rules Playground lulus.
3. Buat dan uji akun owner aktif.
4. Uji checkout menggunakan browser profile terpisah dari sesi owner.
5. Uji pembatasan dokumen dan status dengan UID guest berbeda.
6. Jangan memasukkan transaksi nyata sebelum smoke test staging selesai.


## Dependency audit gate (14 November 2026)

CI currently passes TypeScript and Vite build on Node 24.12, but `npm audit` reports four high-severity package entries: `firebase@13.2.0`, `@firebase/firestore@4.19.1`, `@firebase/firestore-compat@0.4.17`, and transitive `@grpc/grpc-js@1.9.16`. The Firestore SDK pins the Node gRPC transport to `~1.9.0`; the upstream tracking issue is documented in `docs/security/DEPENDENCY_AUDIT_2026-11-14.md`. This app uses the browser Firebase SDK, where Node gRPC is not loaded by the browser runtime, but the install tree is still not audit-clean. Do not force a Firebase major downgrade. Resolve/accept this item before introducing Node-side Firebase Admin, Functions, gRPC server capabilities, or claiming a clean dependency audit.
