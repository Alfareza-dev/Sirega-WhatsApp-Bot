const axios = require("axios");
const xml2js = require("xml2js");

async function checkBMKG() {
  try {
    const response = await axios.get(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml"
    );
    const result = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
    });

    const gempa = result.Infogempa.gempa;

    const info = `🌍 *Info Gempa BMKG Terbaru:*
📍 Lokasi: ${gempa.Wilayah}
🕒 Waktu: ${gempa.Jam}, ${gempa.Tanggal}
💥 Magnitudo: ${gempa.Magnitude}
📏 Kedalaman: ${gempa.Kedalaman}
📌 Koordinat: ${gempa.Coordinates}
🌊 Potensi Tsunami: ${gempa.Potensi}`;

    return info;
  } catch (err) {
    console.error("Gagal ambil data BMKG:", err);
    return "⚠️ Gagal mengambil data gempa dari BMKG.";
  }
}

module.exports = { checkBMKG };
