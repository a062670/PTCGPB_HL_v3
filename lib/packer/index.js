const axios = require("axios");
const serverConfig = require("../../config/server.json");

const encrypt = async (data) => {
  try {
    const res = await axios.post(serverConfig.server + "/encrypt", data, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(res.data);
    return buffer;
  } catch (error) {
    console.error("encrypt error", error.response.data);
    throw new Error("encrypt error");
  }
};

const decrypt = async (data) => {
  try {
    const res = await axios.post(serverConfig.server + "/decrypt", data, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(res.data);
    return buffer;
  } catch (error) {
    console.error("decrypt error", error.response.data);
    throw new Error("decrypt error");
  }
};

module.exports = { encrypt, decrypt };
