function getMainMenu(isAdmin) {
  if (isAdmin) {
    return `📋 *Menu Admin:*
/menu - Tampilkan menu utama
/infodarurat - Cek informasi darurat
/broadcast [pesan] - Kirim ke semua warga
/daftar 62xxx Nama - Tambah warga baru
/setronda [hari] [petugas] - Atur jadwal ronda
/ronda - Lihat jadwal ronda
/infokas - Lihat kas warga
/addkas 62xx [bulan] [lunas/belum] - Tambah kas warga
/sendkas - Kirim file kas .csv
/lapor [judul] - [deskripsi] - Kirim laporan warga
/saran [pesan] - Terima saran dari warga
/tagall - Tag semua anggota grup
/gempa - Info gempa terkini
/listrik - Info pemadaman listrik
/air - Info air mati
/cuaca [kota] - Info cuaca lokal
/ping - Cek respons bot
/status - Cek status sistem bot`;
  } else {
    return `📋 *Menu Warga:*
/menu - Tampilkan menu utama
/infodarurat - Cek informasi darurat
/lapor [judul] - [deskripsi] - Kirim laporan ke admin
/saran [pesan] - Kirim saran ke admin
/ronda - Lihat jadwal ronda
/infokas - Cek status iuran kas
/gempa - Info gempa terkini
/listrik - Info pemadaman listrik
/air - Info air mati
/cuaca [kota] - Info cuaca lokal`;
  }
}

module.exports = { getMainMenu };
