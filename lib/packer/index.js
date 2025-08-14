const { io } = require("socket.io-client");
const serverConfig = require("../../config/server.json");
const versionConfig = require("../../config/version.json");

class CryptionClient {
  constructor(url = serverConfig.server) {
    this.url = url;
    this.socket = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url);

      this.socket.on("connect", () => {
        console.log("Socket.IO 連接已建立");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket.IO 連接錯誤:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("Socket.IO 連接已關閉");
        // 清理所有待處理的請求
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error("連接已斷開"));
        });
        this.pendingRequests.clear();
      });

      // 處理所有回應
      this.socket.on("jwt_response", (response) => {
        this.handleResponse("jwt", response);
      });

      this.socket.on("encrypt_response", (response) => {
        this.handleResponse("encrypt", response);
      });

      this.socket.on("decrypt_response", (response) => {
        this.handleResponse("decrypt", response);
      });

      this.socket.on("heartbeat_response", (response) => {
        this.handleResponse("heartbeat", response);
      });
    });
  }

  handleResponse(type, response) {
    const { requestId, ...data } = response;
    const pendingRequest = this.pendingRequests.get(requestId);

    if (pendingRequest) {
      this.pendingRequests.delete(requestId);
      const { resolve, reject } = pendingRequest;

      if (data.success) {
        resolve(data);
      } else {
        reject(new Error(data.error));
      }
    }
  }

  generateRequestId() {
    return ++this.requestId;
  }

  // 心跳功能
  heartbeat(friendId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket 未連接"));
        return;
      }

      const requestId = this.generateRequestId();
      this.pendingRequests.set(requestId, {
        resolve: (response) => resolve(response.message),
        reject,
      });

      this.socket.emit("heartbeat", {
        requestId,
        friendId,
        version: versionConfig.version,
      });
    });
  }

  // 加密功能
  encrypt(data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket 未連接"));
        return;
      }

      const requestId = this.generateRequestId();
      this.pendingRequests.set(requestId, {
        resolve: (response) => {
          const encryptedData = new Uint8Array(response.data);
          resolve(Buffer.from(encryptedData));
        },
        reject,
      });

      this.socket.emit("encrypt", {
        requestId,
        data: Array.from(data),
      });
    });
  }

  // 解密功能
  decrypt(data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket 未連接"));
        return;
      }

      const requestId = this.generateRequestId();
      this.pendingRequests.set(requestId, {
        resolve: (response) => {
          const decryptedData = new Uint8Array(response.data);
          resolve(Buffer.from(decryptedData));
        },
        reject,
      });

      this.socket.emit("decrypt", {
        requestId,
        data: Array.from(data),
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.pendingRequests.clear();
  }
}

// 創建單例實例
const cryptionClient = new CryptionClient();

// 導出原有的函數接口以保持向後兼容性
const heartbeat = async (friendId) => {
  try {
    if (!cryptionClient.socket) {
      await cryptionClient.connect();
    }
    await cryptionClient.heartbeat(friendId);
  } catch (error) {
    console.error("heartbeat error:", {
      message: error.message,
    });
  }
};

const encrypt = async (data) => {
  try {
    if (!cryptionClient.socket) {
      await cryptionClient.connect();
    }
    return await cryptionClient.encrypt(data);
  } catch (error) {
    console.error("encrypt error:", {
      message: error.message,
    });

    // 根據錯誤類型提供更具體的錯誤信息
    if (error.message.includes("Socket 未連接")) {
      throw new Error("無法連接到加密服務器，請檢查服務器是否運行");
    } else if (error.message.includes("timeout")) {
      throw new Error("加密請求超時");
    } else {
      throw new Error(`加密失敗: ${error.message}`);
    }
  }
};

const decrypt = async (data) => {
  try {
    if (!cryptionClient.socket) {
      await cryptionClient.connect();
    }
    return await cryptionClient.decrypt(data);
  } catch (error) {
    console.error("decrypt error:", {
      message: error.message,
    });

    // 根據錯誤類型提供更具體的錯誤信息
    if (error.message.includes("Socket 未連接")) {
      throw new Error("無法連接到解密服務器，請檢查服務器是否運行");
    } else if (error.message.includes("timeout")) {
      throw new Error("解密請求超時");
    } else {
      throw new Error(`解密失敗: ${error.message}`);
    }
  }
};

module.exports = { heartbeat, encrypt, decrypt, CryptionClient };
