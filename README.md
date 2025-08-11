# 🤖 SIREGA - Sistem Informasi RT Berbasis WhatsApp

SIREGA (Sistem Informasi RT dan Warga) adalah bot WhatsApp berbasis Node.js dan Baileys yang dirancang untuk membantu pengurus RT/RW dalam mendistribusikan informasi, mencatat kas warga, jadwal ronda, laporan warga, hingga data bencana/cuaca secara otomatis dan efisien.

---

## 🚀 Fitur Utama

| Perintah                       | Fungsi                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `/cuaca`                       | Menampilkan info cuaca dari BMKG berdasarkan lokasi tertentu   |
| `/infokas`                     | Menampilkan info pembayaran kas bulanan untuk warga            |
| `/ronda`                       | Melihat jadwal ronda terbaru                                   |
| `/setronda`                    | Admin mengatur jadwal ronda                                    |
| `/lapor`                       | Warga melaporkan keluhan/masalah ke admin                      |
| `/saran`                       | Warga memberikan saran atau masukan                            |
| `/broadcast`                   | Admin menyebarkan pengumuman ke semua warga                    |
| `/cleardatabase`               | Admin menghapus semua data kas, laporan, dan file JSON terkait |
| `/sendkas`                     | Admin mengirimkan file CSV data kas warga                      |
| `/air`, `/listrik`, `/bencana` | Menampilkan informasi status layanan penting                   |
| `/tagall`                      | Admin mention semua anggota grup                               |
| `/status`                      | Menampilkan status bot dan sistem data                         |

---

## 📁 Struktur Folder

```

📦whatsapp-bot-sirega/
┣ 📂data/                # Menyimpan data JSON seperti warga.json, kas.json, laporan.json
┣ 📂utils/               # File pendukung seperti kas.js, helpers.js, dll
┣ 📜index.js             # File utama bot
┣ 📜admin.json           # Daftar nomor admin
┣ 📜package.json         # Info project dan dependencies
┗ 📜README.md            # Dokumentasi ini

```

---

## ⚙️ Instalasi & Menjalankan Bot

### 1. Clone Repo

```bash
git clone https://github.com/username/whatsapp-bot-sirega.git
cd whatsapp-bot-sirega
```

### 2. Install Dependency

```bash
npm install
```

### 3. Jalankan Bot

```bash
node index.js
```

Saat pertama kali dijalankan, bot akan menghasilkan QR code untuk login ke WhatsApp.

---

## 🧠 Teknologi yang Digunakan

- **Node.js**
- **Baileys** (library WhatsApp Web)
- **File System (JSON based)**
- **Open API (BMKG untuk cuaca & bencana)**

---

## 📌 Catatan Penggunaan

- File JSON berisi data sensitif. Pastikan **tidak upload ke publik** jika bot aktif.
- Gunakan `.env` atau `.gitignore` jika ingin lebih aman.
- Bot hanya akan memproses pesan jika pengirimnya **sudah terdaftar di warga.json** (kecuali admin).
- Format nomor WhatsApp warga harus menggunakan awalan `62`.

---

## 👥 Kontributor

- Alfareza (Developer utama)
- Human 1
- Human 2
- Human 3

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) – see the [LICENSE file](./LICENSE) for details.
