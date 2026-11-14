# Project Structure & Directory Responsibilities

KudapKita menggunakan **single codebase, separated application areas**. Storefront pelanggan dan owner workspace tidak dibuat menjadi dua repository yang berbeda, tetapi dipisahkan berdasarkan route, module boundary, state, dan Firestore Security Rules.

```text
kudapkita-platform/
├── apps/
│   └── web/
│       ├── index.html
│       ├── public/
│       │   ├── brand/                 # Logo/brand mark dan identitas statis
│       │   ├── images/products/       # Foto produk yang ditambahkan manual
│       │   ├── manifest.webmanifest
│       │   └── sw.js                  # Cache shell, bukan cache transaksi
│       └── src/
│           ├── app/                   # Composition root dan navigasi aplikasi
│           │   ├── config/            # Konfigurasi aplikasi (future)
│           │   ├── constants/         # Konstanta tingkat aplikasi
│           │   ├── guards/            # UX route guard; bukan security boundary
│           │   ├── providers/         # AuthProvider, CartProvider, global state
│           │   └── types/             # Tipe tingkat aplikasi
│           ├── areas/
│           │   ├── storefront/        # Area visitor dan customer
│           │   │   ├── components/    # ProductCard, DemoBanner, customer widgets
│           │   │   ├── hooks/         # Hook khusus storefront
│           │   │   ├── layouts/       # Header, footer, public shell
│           │   │   ├── pages/         # Home, catalog, cart, checkout, tracking
│           │   │   ├── services/      # Use case khusus customer
│           │   │   └── types/         # View model khusus storefront
│           │   └── owner/             # Area privat owner
│           │       ├── auth/          # Login, schema, auth service, UI login
│           │       ├── dashboard/     # KPI, dashboard widgets, overview service
│           │       ├── orders/        # Inbox, quote, payment verification, status
│           │       ├── products/      # Produk internal dan public catalog projection
│           │       ├── inventory/     # Stok produk jadi dan stock movement
│           │       ├── production/    # Kapasitas produksi dan antrean kerja
│           │       ├── direct-sales/  # Pencatatan penjualan langsung/offline
│           │       ├── reports/       # Rekap pesanan, pembayaran, penjualan
│           │       ├── settings/      # Konfigurasi toko dan informasi pembayaran
│           │       ├── layouts/       # Sidebar, topbar, owner shell
│           │       └── shared/        # Komponen yang hanya dipakai owner area
│           ├── domain/                # Model dan aturan bisnis, tanpa Firebase/React
│           │   ├── constants/        # Enum/status dan konstanta domain
│           │   ├── entities/         # Product, Order, UserProfile, CartLine
│           │   ├── rules/             # Validasi input dan aturan transisi
│           │   ├── services/          # Domain service bila logika lintas entitas muncul
│           │   └── value-objects/     # Money, phone number, order reference (future)
│           ├── data/                 # Implementasi akses data dan adapter Firestore
│           │   ├── fixtures/         # Data demo yang secara eksplisit bukan data asli
│           │   ├── mappers/          # Mapping Firestore document <-> domain entity
│           │   ├── queries/          # Query builder dan parameter query
│           │   ├── repositories/     # Catalog repository, orders repository
│           │   └── validators/       # Validasi payload dan dokumen (future)
│           ├── infrastructure/      # Integrasi layanan eksternal
│           │   ├── firebase/         # Firebase app, Auth, Firestore client
│           │   ├── logging/          # Logger adapter (future)
│           │   └── monitoring/       # Monitoring adapter (future)
│           ├── shared/               # Elemen netral yang aman dipakai kedua area
│           │   ├── components/       # UI primitives dan feedback states
│           │   ├── constants/        # Brand token dan shared constants
│           │   ├── hooks/            # Hook generik
│           │   ├── pages/            # Not-found dan halaman umum
│           │   ├── styles/           # Tailwind entry dan global styles
│           │   ├── types/            # Shared UI types
│           │   └── utils/            # Format rupiah, WhatsApp URL, error helper
│           ├── assets/               # Aset yang di-import oleh komponen
│           └── main.tsx              # React entry point
├── firebase/
│   ├── firestore.rules               # Authorization dan validasi data di server
│   └── firestore.indexes.json       # Composite indexes
├── docs/
│   ├── architecture/                # System overview, roles, route boundaries
│   ├── database/                    # Rancangan koleksi dan field Firestore
│   ├── decisions/                   # Architecture Decision Records (ADR)
│   ├── design/                      # Design handoff dan UI prototype
│   ├── operations/                  # Setup, roadmap, deployment workflow
│   └── security/                    # Access matrix dan batas keamanan Spark
├── scripts/                         # Script maintenance/seed (future)
├── .env.example                     # Contoh konfigurasi; salin menjadi .env.local
├── firebase.json                    # Hosting, rewrites, Rules dan indexes
├── package.json                     # Dependency dan command project
├── tsconfig*.json                   # TypeScript project references
└── vite.config.ts                   # Vite root, alias, Tailwind plugin
```

## 1. Mengapa `storefront` dan `owner` dipisah?

`areas/storefront` adalah pengalaman publik. Kodenya hanya boleh menggunakan katalog publik dan membaca satu pesanan yang dimiliki sesi guest yang membuatnya. Tidak boleh mengimpor data internal owner, HPP, catatan pembayaran privat, inventory, atau pengaturan internal.

`areas/owner` adalah workspace privat. Semua halaman berada di bawah `/owner/*`, menggunakan `OwnerOnlyRoute`, dan membutuhkan Firebase Authentication serta dokumen `userProfiles/{uid}` dengan `role: owner` dan `isActive: true`. Keamanan sesungguhnya tetap berada pada Firestore Security Rules.

## 2. Perbedaan visitor, customer, dan owner

- **Visitor:** belum login; hanya membaca katalog publik dan menggunakan keranjang lokal.
- **Customer:** tidak membuat akun/password. Saat checkout, aplikasi membuat Firebase Anonymous session agar `createdByUid` dapat mengikat pesanan ke sesi browser. Customer hanya dapat membaca dokumen order miliknya.
- **Owner:** login email/password. Tidak ada registrasi owner publik. Akun dan dokumen role pertama dibuat secara manual di Firebase Console.

Jika data browser dibersihkan atau customer pindah perangkat, sesi anonymous mungkin tidak tersedia lagi. Customer perlu menghubungi owner dengan kode pesanan. Gunakan profil browser terpisah saat menguji owner dan guest dalam satu komputer.

## 3. Layer boundaries

1. `domain` tidak boleh mengimpor Firebase, React, atau komponen UI.
2. `areas` tidak menulis query Firestore mentah di halaman; gunakan repository/service.
3. `data/repositories` menangani query dan operasi database.
4. `infrastructure` menginisialisasi SDK dan layanan eksternal.
5. `shared` hanya berisi komponen netral; komponen khusus owner tetap di `areas/owner`.
6. Data internal tidak boleh disalin ke dokumen publik. Buat public projection yang hanya memuat field katalog.
7. Arah dependensi: `areas -> domain/data/shared -> infrastructure`, bukan sebaliknya.

## 4. Aturan menjaga struktur tetap sehat

- Satu modul memiliki `pages`, `components`, `services`, `schemas`, dan `types` hanya ketika kebutuhan nyata muncul. Folder `.gitkeep` adalah slot arsitektur, bukan alasan untuk membuat puluhan file kosong.
- Hindari file `utils.ts` raksasa; utilitas harus dikelompokkan berdasarkan domain dan tujuannya.
- Jangan membuat barrel `index.ts` untuk semua folder secara otomatis. Export hanya yang memang menjadi API modul.
- Jangan membuat folder `admin` terpisah untuk fitur yang sebenarnya bagian dari owner. MVP hanya punya role owner; staff roles bisa ditambahkan setelah proses operasional jelas.
- Jangan menambahkan backend Cloud Functions/Storage ke MVP Spark tanpa evaluasi billing dan keputusan arsitektur baru.
