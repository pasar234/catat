# 📦 Stok Pintar - Aplikasi Manajemen Stok

Aplikasi web untuk manajemen stok produk dengan 4 kategori: **NARITA, VR, KUDUS, LAIN**.

## 🚀 Fitur Utama
- ✅ Tambah produk dengan kategori
- ✅ Kelola stok (tambah/kurangi)
- ✅ Pencarian produk
- ✅ Backup & restore data
- ✅ Tema gelap/terang
- ✅ PWA (install di Android/iOS)
- ✅ Bekerja offline
- ✅ Responsif mobile & desktop

## 📱 Cara Install di Android
1. Buka: `https://[username].github.io/stok-manajemen-app/`
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. Aplikasi siap digunakan (termasuk offline)

## 💻 Cara Install di Desktop
1. Buka di Chrome/Edge
2. Klik ikon install di address bar
3. Klik "Install Stok Pintar"

## 📊 Struktur Data
Data disimpan di localStorage browser:
- Nama, kode, harga beli/jual
- Stok produk
- Kategori (NARITA/VR/KUDUS/LAIN)
- Timestamp

## 🔧 Teknologi
- HTML5, CSS3, JavaScript
- Service Workers untuk offline
- Local Storage untuk data
- PWA untuk installability

## 📁 File
1. `index.html` - Halaman utama
2. `styles.css` - Styling aplikasi
3. `app.js` - Logika aplikasi
4. `manifest.json` - Konfigurasi PWA
5. `service-worker.js` - Offline capability
6. `README.md` - Dokumentasi

## 🐛 Troubleshooting
Jika tidak bisa install:
1. Clear cache browser
2. Buka: `chrome://serviceworker-internals`
3. Unregister service worker lama
4. Refresh halaman

## 📞 Support
Jika ada masalah, buka issue di GitHub repository.

---
© 2024 Stok Pintar - Manajemen Stok Produk
