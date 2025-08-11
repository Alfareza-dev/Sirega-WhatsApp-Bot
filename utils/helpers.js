const adminData = require("../admin.json");
const wargaData = require("../data/warga.json");

function normalizeNomor(nomor) {
  return nomor.replace("@s.whatsapp.net", "");
}

function isAdmin(jid) {
  return adminData.includes(jid);
}

function isWarga(jid) {
  const nomor = normalizeNomor(jid);
  return wargaData.some((w) => w.nomor === nomor);
}

module.exports = { isAdmin, isWarga };
