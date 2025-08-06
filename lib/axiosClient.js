const axios = require("axios");
const https = require("https");
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  maxFreeSockets: 10,
});
const axiosClient = axios.create({
  baseURL: "https://1c04691f14f85ad285ebb3d2ffa4aef0.baas.nintendo.com",
  httpsAgent,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

module.exports = axiosClient;
