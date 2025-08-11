const axios = require("axios");
const serverConfig = require("../../config/server.json");

const heartbeat = async (friendId) => {
  try {
    await axios.post(serverConfig.server + "/heartbeat", {
      friendId,
    });
  } catch (error) {
    console.error("heartbeat error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
  }
};

const encrypt = async (data) => {
  try {
    const res = await axios.post(serverConfig.server + "/encrypt", data, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
      timeout: 30000, // 30秒超時
    });
    const buffer = Buffer.from(res.data);
    return buffer;
  } catch (error) {
    console.error("encrypt error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      },
    });

    // 根據錯誤類型提供更具體的錯誤信息
    if (error.code === "ECONNREFUSED") {
      throw new Error("無法連接到加密服務器，請檢查服務器是否運行");
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("加密請求超時");
    } else if (error.response?.status === 500) {
      throw new Error("加密服務器內部錯誤");
    } else {
      throw new Error(`加密失敗: ${error.message}`);
    }
  }
};

const decrypt = async (data) => {
  try {
    const res = await axios.post(serverConfig.server + "/decrypt", data, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
      timeout: 30000, // 30秒超時
    });
    const buffer = Buffer.from(res.data);
    return buffer;
  } catch (error) {
    console.error("decrypt error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      },
    });

    // 根據錯誤類型提供更具體的錯誤信息
    if (error.code === "ECONNREFUSED") {
      throw new Error("無法連接到解密服務器，請檢查服務器是否運行");
    } else if (error.code === "ETIMEDOUT") {
      throw new Error("解密請求超時");
    } else if (error.response?.status === 500) {
      throw new Error("解密服務器內部錯誤");
    } else {
      throw new Error(`解密失敗: ${error.message}`);
    }
  }
};

module.exports = { heartbeat, encrypt, decrypt };
