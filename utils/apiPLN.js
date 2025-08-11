const fs = require("fs");

function checkListrik() {
  try {
    const data = JSON.parse(fs.readFileSync("./data/data_listrik.json"));
    if (data.length === 0) return "✅ Tidak ada pemadaman listrik saat ini.";

    let result = "⚠️ *Jadwal Pemadaman Listrik Terdekat:*\n\n";
    for (const entry of data) {
      result += `📍 Wilayah: ${entry.wilayah}\n🗓️ Tanggal: ${entry.tanggal}\n⏰ Jam: ${entry.jam}\n🧾 Penyebab: ${entry.penyebab}\n\n`;
    }
    return result.trim();
  } catch (err) {
    console.error("Gagal ambil data listrik:", err.message);
    return "❌ Gagal mengambil data pemadaman listrik.";
  }
}

module.exports = { checkListrik };
