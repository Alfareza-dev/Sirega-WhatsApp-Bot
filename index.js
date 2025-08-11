const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const P = require("pino");
const qrcode = require("qrcode-terminal");
const os = require("os");
const osu = require("os-utils");
const moment = require("moment");

const { getMainMenu } = require("./utils/menu");
const { isAdmin, isWarga } = require("./utils/helpers");
const { checkBMKG } = require("./utils/apiBMKG");
const { checkListrik } = require("./utils/apiPLN");
const { getCuaca } = require("./utils/apiCuaca");
const kas = require("./utils/kas");
const ronda = require("./utils/ronda");

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const store = makeInMemoryStore({
    logger: P().child({ level: "silent", stream: "store" }),
  });

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "silent" }),
  });

  store.bind(sock.ev);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) startSock();
    } else if (connection === "open") {
      console.log("✅ Bot SIREGA Tersambung!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const senderId = msg.key.participant || sender;
    const fromGroup = sender.endsWith("@g.us");

    console.log(
      `[📩] Pesan masuk dari ${
        fromGroup ? "GRUP" : "PRIVATE"
      } - Pengirim: ${senderId}`
    );

    const isAdminUser = isAdmin(senderId);
    const isWargaUser = isWarga(senderId);
    const text =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    if (text.startsWith("/")) {
      switch (text.split(" ")[0]) {
        case "/menu":
          const menu = getMainMenu(isAdminUser);
          await sock.sendMessage(sender, { text: menu });
          break;

        case "/ping":
          const start = Date.now();
          osu.cpuUsage(async function (cpuPercent) {
            const ramUsedMB = (os.totalmem() - os.freemem()) / (1024 * 1024);
            const ramTotalMB = os.totalmem() / (1024 * 1024);
            const uptimeSec = os.uptime();
            const uptimeHours = Math.floor(uptimeSec / 3600);
            const uptimeMinutes = Math.floor((uptimeSec % 3600) / 60);

            const delay = Date.now() - start;

            const reply =
              `*🏓 Pong!* ${delay}ms\n` +
              `🧠 CPU: ${(cpuPercent * 100).toFixed(1)}%\n` +
              `🧬 RAM: ${ramUsedMB.toFixed(1)} MB / ${ramTotalMB.toFixed(
                1
              )} MB\n` +
              `⏱️ Uptime: ${uptimeHours} jam ${uptimeMinutes} menit`;

            await sock.sendMessage(sender, { text: reply });
          });
          break;

        case "/status":
          const uptime = os.uptime();
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);

          osu.cpuUsage(async function (cpuPercent) {
            const usedMem = (os.totalmem() - os.freemem()) / (1024 * 1024);
            const totalMem = os.totalmem() / (1024 * 1024);

            let adminCount = 0;
            let wargaCount = 0;
            let saranCount = 0;
            try {
              adminCount = JSON.parse(fs.readFileSync("./admin.json")).length;
              wargaCount = JSON.parse(
                fs.readFileSync("./data/warga.json")
              ).length;
              const saranLog = fs.readFileSync(
                "./data/saran_log.json",
                "utf-8"
              );
              saranCount = (saranLog.match(/"saran":/g) || []).length;
            } catch (err) {
              console.log("❌ Gagal membaca file status:", err);
            }

            const status =
              `📊 *STATUS BOT SIREGA*\n\n` +
              `⏱️ Uptime: ${hours} jam ${minutes} menit\n` +
              `🧠 CPU: ${(cpuPercent * 100).toFixed(1)}%\n` +
              `💾 RAM: ${usedMem.toFixed(1)} MB / ${totalMem.toFixed(
                1
              )} MB\n\n` +
              `📩 Saran masuk: ${saranCount}\n` +
              `🧑‍🤝‍🧑 Jumlah warga: ${wargaCount}\n` +
              `🛡️ Jumlah admin: ${adminCount}\n\n` +
              `🛰️ WhatsApp Status: CONNECTED ✅`;

            await sock.sendMessage(sender, { text: status });
          });
          break;

        case "/daftar": {
          const args = text.trim().split(" ");
          const senderNumber = senderId.split("@")[0];
          if (!isAdminUser) {
            await sock.sendMessage(sender, {
              text: "❌ Hanya admin yang dapat mendaftarkan warga baru.",
            });
            break;
          }

          if (args.length < 3) {
            await sock.sendMessage(sender, {
              text: "❗ Format salah.\nContoh: /daftar 62xxxxxxx Nama Warga",
            });
            break;
          }
          const nomor = args[1]?.replace(/\D/g, "");
          const nama = args.slice(2).join(" ");
          if (!nomor || !nama) {
            await sock.sendMessage(sender, {
              text: "❌ Nomor atau nama tidak valid.",
            });
            break;
          }
          const wargaData = JSON.parse(fs.readFileSync("./data/warga.json"));
          const sudahAda = wargaData.some((w) => w.nomor === nomor);
          if (sudahAda) {
            await sock.sendMessage(sender, {
              text: `⚠️ Nomor ${nomor} sudah terdaftar sebagai warga.`,
            });
            break;
          }
          wargaData.push({ nomor, nama });
          fs.writeFileSync(
            "./data/warga.json",
            JSON.stringify(wargaData, null, 2)
          );

          await sock.sendMessage(sender, {
            text: `✅ Warga berhasil didaftarkan:\n📞 Nomor: ${nomor}\n👤 Nama: ${nama}`,
          });

          const waID = nomor + "@s.whatsapp.net";
          await sock.sendMessage(waID, {
            text: `Halo ${nama}, kamu telah terdaftar sebagai warga RT melalui SIREGA. Silakan gunakan /menu untuk melihat fitur yang tersedia.`,
          });
          break;
        }

        case "/cleardatabase":
          if (!isAdmin(senderId)) {
            return sock.sendMessage(sender, { text: "❌ Kamu bukan admin." });
          }

          try {
            const adminData = JSON.parse(fs.readFileSync("./admin.json"));
            fs.writeFileSync("./data/warga.json", JSON.stringify([]));
            fs.writeFileSync("./data/kas.json", JSON.stringify([]));
            fs.writeFileSync("./data/kas.csv", "");
            fs.writeFileSync("./data/saran_log.json", "[]");
            fs.writeFileSync("./data/laporan.json", "[]");
            fs.writeFileSync("./data/ronda.json", JSON.stringify({}, null, 2));
            fs.writeFileSync("./admin.json", JSON.stringify(adminData));

            await sock.sendMessage(sender, {
              text: "✅ Database berhasil dibersihkan. Semua data warga, kas, dan file CSV telah di-reset.",
            });
          } catch (err) {
            console.log("❌ Error saat membersihkan database:", err);
            await sock.sendMessage(sender, {
              text: "⚠️ Terjadi kesalahan saat membersihkan database.",
            });
          }
          break;

        case "/infodarurat":
          const bencana = await checkBMKG();
          const nomorDarurat = `
    🚨 *Nomor Darurat RT :*

        🔥 Pemadam Kebakaran: 113
        🚑 Ambulans: 118
        🚓 Polisi: 110
        🏥 Rumah Sakit: 123
        🏠 Kantor RT: 

    Jangan ragu untuk menghubungi nomor-nomor ini di saat darurat!
    `;
          const reply = `🌐 *Info Bencana Terbaru:*\n${bencana}\n\n${nomorDarurat}`;
          await sock.sendMessage(sender, { text: reply });
          break;

        case "/gempa":
          const statusGempa = await checkBMKG();
          await sock.sendMessage(sender, {
            text: `🌐 Info Gempa Terbaru:\n${statusGempa}`,
          });
          break;

        case "/cuaca":
          const kota = text.replace("/cuaca", "").trim();
          if (!kota)
            return sock.sendMessage(sender, {
              text: "❗ Contoh: /cuaca Jakarta",
            });
          const infoCuaca = await getCuaca(kota);
          await sock.sendMessage(sender, { text: infoCuaca });
          break;

        case "/listrik":
          const listrik = checkListrik();
          await sock.sendMessage(sender, { text: listrik });
          break;

        case "/air":
          try {
            const air = JSON.parse(fs.readFileSync("./data/data_air.json"));
            const wilayah = air.wilayah.join(", ");
            const msgAir =
              `🚱 *Info Gangguan Air:*\n` +
              `💦 Status: Air saat ini *${air.status}*\n` +
              `🕒 Estimasi nyala: ${air.estimasi}\n` +
              `📍 Wilayah terdampak: ${wilayah}`;
            await sock.sendMessage(sender, { text: msgAir });
          } catch (err) {
            await sock.sendMessage(sender, {
              text: "❗ Gagal membaca info air. Coba lagi nanti.",
            });
          }
          break;

        case "/infokas":
          try {
            const kasData = kas.loadKasData();
            const wargaData = JSON.parse(fs.readFileSync("./data/warga.json"));

            const pengirim = msg.key.participant || msg.key.remoteJid;
            const nomorPengirim = pengirim.replace("@s.whatsapp.net", "");

            const dataWarga = wargaData.find(
              (item) => item.nomor === nomorPengirim
            );

            if (!dataWarga) {
              return await sock.sendMessage(sender, {
                text: "⚠️ Nomor ini belum terdaftar sebagai warga.",
              });
            }

            const dataKas = kasData.find(
              (item) => item.nomor === nomorPengirim
            );

            if (!dataKas || !dataKas.kas) {
              return await sock.sendMessage(sender, {
                text: "ℹ️ Belum ada data kas untuk Anda.",
              });
            }

            const bulanList = Object.keys(dataKas.kas);
            let pesan = `💰 *Info Kas ${dataWarga.nama}*\n\n`;

            bulanList.forEach((bulan) => {
              const status = dataKas.kas[bulan];
              pesan += `• ${bulan} : ${status}\n`;
            });

            return await sock.sendMessage(sender, { text: pesan });
          } catch (err) {
            console.error("Error /infokas:", err);
            return await sock.sendMessage(sender, {
              text: "❌ Terjadi kesalahan saat mengambil data kas Anda.",
            });
          }
          break;

        case "/addkas": {
          const args = text.trim().split(" ");
          if (!isAdminUser) {
            return await sock.sendMessage(sender, {
              text: "❌ Fitur ini hanya untuk admin.",
            });
          }
          if (args.length < 4) {
            return await sock.sendMessage(sender, {
              text: "🔧 Format salah!\nGunakan: /addkas [nomor] [bulan] [lunas/belum]",
            });
          }

          const [_, nomorArg, bulanArg, statusArg] = args;
          const nomorKas = nomorArg.replace(/^0/, "62");

          const wargaList = JSON.parse(fs.readFileSync("./data/warga.json"));
          const targetWarga = wargaList.find((w) => w.nomor === nomorKas);

          if (!targetWarga) {
            return await sock.sendMessage(sender, {
              text: "❌ Nomor ini belum terdaftar sebagai warga.",
            });
          }

          const kasData = kas.loadKasData();
          let dataKas = kasData.find((item) => item.nomor === nomorKas);

          if (!dataKas) {
            dataKas = { nomor: nomorKas, nama: targetWarga.nama, kas: {} };
            kasData.push(dataKas);
          }

          dataKas.kas[bulanArg] = statusArg.toLowerCase();
          kas.simpanKasData(kasData);

          await sock.sendMessage(sender, {
            text: `✅ Kas untuk *${targetWarga.nama}* bulan *${bulanArg}* diupdate jadi *${statusArg}*`,
          });

          break;
        }

        case "/sendkas":
          if (!isAdmin)
            return await sock.sendMessage(sender, {
              text: "❌ Fitur ini hanya untuk admin.",
            });

          const kasDataSend = kas.loadKasData();

          let csvContent = "Nama,Nomor,Bulan,Status\n";

          kasDataSend.forEach((entry) => {
            const { nama, nomor, kas: kasBulanan } = entry;
            for (const bulan in kasBulanan) {
              csvContent += `${nama},${nomor},${bulan},${kasBulanan[bulan]}\n`;
            }
          });

          const filePath = "./data/kas.csv";
          fs.writeFileSync(filePath, csvContent);

          await sock.sendMessage(sender, {
            document: fs.readFileSync(filePath),
            fileName: "data_kas.csv",
            mimetype: "text/csv",
          });

          await sock.sendMessage(sender, {
            text: "📎 Data kas berhasil dikirim dalam format CSV.",
          });
          break;

        case "/ronda":
          try {
            const jadwalRonda = JSON.parse(
              fs.readFileSync("./data/ronda.json")
            );
            let teksRonda = "📅 *Jadwal Ronda Mingguan:*\n\n";

            for (const [hari, jadwal] of Object.entries(jadwalRonda)) {
              teksRonda += `🗓️ *${
                hari.charAt(0).toUpperCase() + hari.slice(1)
              }*: ${jadwal || "Kosong"}\n`;
            }

            await sock.sendMessage(sender, { text: teksRonda });
          } catch (err) {
            console.log("❌ Gagal membaca jadwal ronda:", err);
            await sock.sendMessage(sender, {
              text: "❌ Terjadi kesalahan saat mengambil jadwal ronda.",
            });
          }
          break;

        case "/setronda": {
          if (!isAdminUser)
            return sock.sendMessage(sender, {
              text: "❌ Hanya admin yang dapat mengatur jadwal ronda.",
            });

          const args = text.trim().split(" ");
          const hariSet = args[1]?.toLowerCase();
          const petugas = args.slice(2).join(" ");

          if (!hariSet || !petugas) {
            await sock.sendMessage(sender, {
              text: "❌ Format salah. Gunakan: /setronda [hari] [petugas]",
            });
            break;
          }

          let jadwal = {};
          try {
            if (fs.existsSync("./data/ronda.json")) {
              const file = fs.readFileSync("./data/ronda.json", "utf-8");
              jadwal = JSON.parse(file);
            }
          } catch (err) {
            console.error("❌ Gagal membaca ronda.json:", err);
          }

          jadwal[hariSet] = petugas;

          try {
            fs.writeFileSync(
              "./data/ronda.json",
              JSON.stringify(jadwal, null, 2)
            );
            await sock.sendMessage(sender, {
              text: `✅ Jadwal ronda hari *${hariSet}* telah diperbarui:\n👮 Petugas: ${petugas}`,
            });
          } catch (err) {
            console.error("❌ Gagal menyimpan ronda.json:", err);
            await sock.sendMessage(sender, {
              text: "❌ Gagal menyimpan jadwal ronda.",
            });
          }
          break;
        }

        case "/saran":
          const saran = text.replace("/saran", "").trim();
          if (!saran)
            return sock.sendMessage(sender, {
              text: "❗ Masukkan saran setelah perintah /saran",
            });
          fs.appendFileSync(
            "./data/saran_log.json",
            `{"from": "${senderId}", "saran": "${saran}"},\n`
          );
          const adminData = JSON.parse(fs.readFileSync("./admin.json"));
          for (const admin of adminData) {
            await sock.sendMessage(admin, {
              text: `📩 Saran baru dari warga:\n${saran}`,
            });
          }
          await sock.sendMessage(sender, {
            text: "✅ Terima kasih atas sarannya!",
          });
          break;

        case "/lapor":
          const laporanText = text.replace("/lapor", "").trim();
          if (!laporanText)
            return sock.sendMessage(sender, {
              text: "❗ Masukkan judul dan deskripsi laporan setelah perintah /lapor",
            });

          const laporanParts = laporanText.split(" - ");
          const judulLaporan = laporanParts[0]?.trim();
          const deskripsiLaporan = laporanParts[1]?.trim();

          if (!judulLaporan || !deskripsiLaporan) {
            return sock.sendMessage(sender, {
              text: "⚠️ Format laporan tidak lengkap. Pastikan formatnya: /lapor [judul] - [deskripsi]",
            });
          }
          try {
            const laporanData = JSON.parse(
              fs.readFileSync("./data/laporan.json")
            );
            const newLaporan = {
              nomor: sender,
              judul: judulLaporan,
              deskripsi: deskripsiLaporan,
              tanggal: new Date().toISOString(),
            };
            laporanData.push(newLaporan);
            fs.writeFileSync(
              "laporan.json",
              JSON.stringify(laporanData, null, 2)
            );

            const adminData = JSON.parse(fs.readFileSync("./admin.json"));
            for (const admin of adminData) {
              await sock.sendMessage(admin, {
                text: `📩 Laporan Baru:\n*${judulLaporan}*\n${deskripsiLaporan}`,
              });
            }
            await sock.sendMessage(sender, {
              text: "✅ Laporan berhasil dikirim kepada admin. Terima kasih atas laporannya!",
            });
          } catch (err) {
            console.log("❌ Gagal menyimpan laporan:", err);
            await sock.sendMessage(sender, {
              text: "⚠️ Terjadi kesalahan saat mengirim laporan. Coba lagi nanti.",
            });
          }
          break;

        case "/broadcast":
          if (!isAdminUser) {
            await sock.sendMessage(sender, {
              text: "❌ Hanya admin yang dapat mengirim broadcast.",
            });
            break;
          }

          const pesan = text.replace("/broadcast", "").trim();
          if (!pesan) {
            await sock.sendMessage(sender, {
              text: "❌ Masukkan pesan untuk dikirim broadcast.\nContoh: /broadcast Besok ada kerja bakti!",
            });
            break;
          }

          try {
            const warga = JSON.parse(fs.readFileSync("./data/warga.json"));

            for (const w of warga) {
              if (!w.nomor) continue;

              const jid = w.nomor.includes("@s.whatsapp.net")
                ? w.nomor
                : `${w.nomor}@s.whatsapp.net`;

              try {
                await sock.sendMessage(jid, {
                  text: `📢 *Pengumuman RT:*\n\n${pesan}`,
                });

                await new Promise((resolve) => setTimeout(resolve, 500)); // Optional delay
              } catch (err) {
                console.error(`❌ Gagal kirim ke ${jid}:`, err.message);
              }
            }

            await sock.sendMessage(sender, {
              text: "✅ Broadcast berhasil dikirim ke semua warga.",
            });
          } catch (err) {
            console.error("Broadcast error:", err);
            await sock.sendMessage(sender, {
              text: "❌ Gagal mengirim broadcast.",
            });
          }
          break;

        case "/tagall":
          if (!fromGroup)
            return sock.sendMessage(sender, {
              text: "❌ Perintah ini hanya bisa digunakan di grup!",
            });
          if (!isAdmin(senderId))
            return sock.sendMessage(sender, {
              text: "❌ Kamu bukan admin grup.",
            });

          const groupMeta = await sock.groupMetadata(sender);
          const mentions = groupMeta.participants.map((p) => p.id);
          const mentionNames = groupMeta.participants
            .map((p) => "@" + p.id.split("@")[0])
            .join(" ");

          await sock.sendMessage(sender, {
            text: `📢 *Tag All oleh Admin!*\n\n${mentionNames}`,
            mentions,
          });
          break;

        default:
          await sock.sendMessage(sender, {
            text: "❓ Perintah tidak dikenal. Coba ketik /menu",
          });
      }
    }
  });
}

startSock();
