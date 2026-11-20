# Setup akun Owner KudapKita

Tidak ada email/username/password default di source code. Owner login menggunakan Firebase Authentication Email/Password dan wajib mempunyai dokumen Firestore `userProfiles/{uid}` dengan role `owner` serta `isActive: true`.

## 1. Buat akun Authentication

1. Buka Firebase Console milik project KudapKita.
2. Masuk ke Authentication > Sign-in method dan aktifkan Email/Password.
3. Buka Authentication > Users > Add user.
4. Masukkan email owner yang dikuasai pemilik usaha dan buat password unik yang kuat. Simpan di password manager; jangan commit ke Git atau mengirimkannya di chat.
5. Setelah user dibuat, salin UID akun tersebut.

## 2. Beri role owner

1. Buka Firestore Database > Data.
2. Buat collection `userProfiles` jika belum ada.
3. Buat document dengan Document ID persis UID dari Authentication.
4. Tambahkan field:

```json
{
  "uid": "UID_DARI_FIREBASE_AUTH",
  "displayName": "Owner KudapKita",
  "email": "EMAIL_OWNER",
  "role": "owner",
  "isActive": true
}
```

Gunakan tipe string untuk `uid`, `displayName`, `email`, `role`; dan boolean untuk `isActive`.

Firestore Console menggunakan akses administrator project. Jangan membuat endpoint publik untuk mengubah role. Firestore Rules memang menolak create/update/delete `userProfiles` dari browser.

## 3. Login

Buka `/owner/login` (contoh lokal: `http://localhost:5173/owner/login`) dan masukkan email serta password yang dibuat pada langkah 1. Login akan ditolak jika dokumen profile tidak ada, role bukan `owner`, atau `isActive` bukan `true`.

## 4. Reset password

Halaman login menyediakan tombol "Lupa password?". Masukkan email owner lalu minta tautan reset. Pastikan domain localhost/deployment sudah diizinkan pada Authentication > Settings > Authorized domains.

## Catatan keamanan

- Tidak ada kredensial default atau akun admin hardcoded.
- Jangan gunakan password contoh seperti `admin123` atau `fakih234`.
- Jangan pernah menyimpan password di source code, `.env` frontend, Firestore, atau Git.
- Batasi akses Firebase Console hanya untuk pemilik/pengelola tepercaya dan aktifkan MFA pada akun Google pemilik project.
