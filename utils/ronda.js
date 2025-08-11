const fs = require("fs");
const path = require("path");

const RONDA_FILE = path.join(__dirname, "./data/ronda.json");

function initRondaData() {
  return {
    Senin: [],
    Selasa: [],
    Rabu: [],
    Kamis: [],
    Jumat: [],
    Sabtu: [],
    Minggu: [],
  };
}

function loadRonda() {
  if (!fs.existsSync(RONDA_FILE)) {
    saveRonda(initRondaData());
  }
  const data = fs.readFileSync(RONDA_FILE, "utf-8");
  return JSON.parse(data);
}

function saveRonda(data) {
  fs.writeFileSync(RONDA_FILE, JSON.stringify(data, null, 2));
}

function tambahRonda(hari, nama) {
  const data = loadRonda();
  if (!data[hari]) return false;

  if (!data[hari].includes(nama)) {
    data[hari].push(nama);
    saveRonda(data);
  }
  return true;
}

function getJadwalRonda() {
  const data = loadRonda();
  let teks = "🛡️ *Jadwal Ronda RT Minggu Ini:*\n\n";
  for (const hari in data) {
    const petugas = data[hari];
    teks += `📅 ${hari}:\n`;
    if (petugas.length === 0) {
      teks += `   - Belum ada yang dijadwalkan\n`;
    } else {
      petugas.forEach((nama, i) => {
        teks += `   ${i + 1}. ${nama}\n`;
      });
    }
    teks += "\n";
  }
  return teks.trim();
}

module.exports = {
  tambahRonda,
  getJadwalRonda,
};
