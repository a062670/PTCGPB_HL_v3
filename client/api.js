class SocketApiService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // 連接到服務器
  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = io("http://localhost:9487", {
        transports: ["websocket", "polling"],
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("已連接到Socket.io服務器");
        this.isConnected = true;
        resolve();
      });

      this.socket.on("disconnect", () => {
        console.log("與Socket.io服務器斷線");
        this.isConnected = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket.io連接錯誤:", error);
        this.isConnected = false;
        reject(error);
      });
    });
  }

  // 斷開連接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 共用函數：處理API請求
  async request(event, data = null) {
    await this.connect();

    return new Promise((resolve, reject) => {
      // console.log(`發送 ${event} 事件，數據:`, data);

      // 設置超時
      const timeout = setTimeout(() => {
        console.log(`${event} 請求超時`);
        reject(new Error("請求超時"));
      }, 10000);

      // 監聽回應事件
      const responseEvent = `${event}Response`;
      const responseHandler = (response) => {
        // console.log(`收到 ${responseEvent} 回應:`, response);
        clearTimeout(timeout);
        this.socket.off(responseEvent, responseHandler);

        if (response && response.code === 0) {
          resolve({
            success: true,
            data: response.data,
            message: response.message,
          });
        } else {
          reject(new Error(response?.message || "未知錯誤"));
        }
      };

      this.socket.on(responseEvent, responseHandler);

      // 發送事件
      this.socket.emit(event, data);
    });
  }

  // 帳號相關 API
  async getAccounts() {
    return this.request("getAccounts", null);
  }
}

// 建立全域 Socket API 服務實例
const socketApiService = new SocketApiService();

export default socketApiService;
