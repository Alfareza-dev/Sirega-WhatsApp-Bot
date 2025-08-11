const axios = require("axios");
const API_KEY = "Your ApiKey";

async function getCuaca(kota) {
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: kota,
          appid: API_KEY,
          lang: "id",
          units: "metric",
        },
      }
    );

    const data = res.data;
    return `📍 Cuaca di *${data.name}*:\n🌤️ ${data.weather[0].description}\n🌡️ Suhu: ${data.main.temp}°C\n💧 Kelembapan: ${data.main.humidity}%\n🌬️ Angin: ${data.wind.speed} m/s`;
  } catch (err) {
    return "⚠️ Gagal mengambil data cuaca. Pastikan nama kota benar!";
  }
}

module.exports = { getCuaca };
