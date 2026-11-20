CATATAN LAMA — UI POLISH PATCH (17 NOVEMBER 2026)

Patch yang dijelaskan di bawah ini sudah menjadi bagian dari source project saat ini. ZIP KudapKita frontend redesign terbaru adalah paket project lengkap, bukan patch 5 file. Jangan gunakan instruksi ekstrak patch lama ini untuk mengganti source versi baru.

KUDAPKITA — UI POLISH PATCH

Isi patch:
- Perbaikan cascade typography Tailwind agar teks putih pada hero, CTA, dan footer tampil dengan kontras yang benar.
- Definisi section-title dan section-copy yang sebelumnya belum tersedia.
- Hero carousel lebih proporsional (400 px mobile, 460 px tablet, 520 px desktop).
- Ritme jarak section homepage dan brand story lebih rapat dan konsisten.
- CTA bawah halaman memiliki heading dan copy putih yang terbaca.
- Footer 3 kolom lebih rapi; chip WhatsApp/Instagram tidak lagi dipaksa menjadi kotak 36x36.
- Perbaikan minimum-height root agar footer tidak mengambang pada halaman pendek.

CARA MEMASANG:
1. Buka folder root proyek kudapkita-platform.
2. Buat backup file yang ada atau gunakan backup yang dibuat sebelumnya.
3. Ekstrak ZIP ini ke root proyek dan pilih Replace/Timpa untuk file yang sama.
4. Jalankan npm run typecheck lalu npm run build.
5. Restart dev server, lalu refresh browser dengan Ctrl+F5.

Patch hanya mengganti 5 file source di apps/web/src. Tidak mengubah Firebase, database, rules,
produk, pesanan, autentikasi, ataupun konfigurasi rahasia.
