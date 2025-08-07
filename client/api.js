class SocketApiService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map(); // 存儲事件監聽器
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

      // 設置通知監聽器
      this.setupNotificationListeners();
    });
  }

  // 設置通知監聽器
  setupNotificationListeners() {
    // 監聽帳號更新通知
    this.socket.on("updateAccount", (account) => {
      console.log("收到帳號更新通知:", account);
      this.emitEvent("updateAccount", account);
    });
  }

  // 監聽通知事件
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // 移除通知事件監聽器
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 發射事件給監聽器
  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件 ${event} 的回調函數執行錯誤:`, error);
        }
      });
    }
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

  // 登入
  async login(accountId) {
    return this.request("login", { id: accountId });
  }

  // 登出
  async logout(accountId) {
    return this.request("logout", { id: accountId });
  }

  // 加好友
  async approve(accountId) {
    return this.request("approve", { id: accountId });
  }

  // 停止加好友
  async stopApprove(accountId) {
    return this.request("stopApprove", { id: accountId });
  }

  // 刪除所有好友
  async deleteAllFriends(accountId) {
    return this.request("deleteAllFriends", { id: accountId });
  }

  // 取得得卡列表
  async getFeedList(accountId) {
    return this.request("getFeedList", { id: accountId });
  }
}

// 建立全域 Socket API 服務實例
const socketApiService = new SocketApiService();

export default socketApiService;
