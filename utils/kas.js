const fs = require("fs");

const KAS_PATH = "./data/kas.json";

function loadKasData() {
  if (!fs.existsSync(KAS_PATH)) return {};
  return JSON.parse(fs.readFileSync(KAS_PATH));
}

function simpanKasData(data) {
  fs.writeFileSync(KAS_PATH, JSON.stringify(data, null, 2));
}

function generateCSV() {
  const data = loadKasData();
  const warga = JSON.parse(fs.readFileSync("./data/warga.json"));
  const lines = ["Nomor,Nama,Bulan Dibayar"];

  for (const nomor in data) {
    const nama = (warga.find((w) => w.nomor === nomor) || {}).nama || "-";
    const bulan = data[nomor].join(", ");
    lines.push(`${nomor},${nama},${bulan}`);
  }

  const csv = lines.join("\n");
  const path = "./kas.csv";
  fs.writeFileSync(path, csv);
  return path;
}

module.exports = { loadKasData, simpanKasData, generateCSV };
