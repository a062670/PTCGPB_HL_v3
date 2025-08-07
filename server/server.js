const express = require("express");
const open = require("open");
const { createServer } = require("http");
const { Server } = require("socket.io");
const actions = require("./actions");

actions.reloadConfig();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.static("client"));

// 共用函數：發送成功回應
const sendSuccessResponse = (socket, eventName, data) => {
  socket.emit(`${eventName}Response`, {
    code: 0,
    message: "success",
    data,
  });
  console.log(`已發送 ${eventName}Response`);
};

// 共用函數：發送錯誤回應
const sendErrorResponse = (socket, eventName, error) => {
  console.error(`${eventName} 錯誤:`, error);
  socket.emit(`${eventName}Response`, {
    code: 500,
    message: error.message || "未知錯誤",
    data: null,
  });
};

// 共用函數：處理Socket事件
const handleSocketEvent = async (socket, eventName, handler) => {
  try {
    const result = await handler();
    sendSuccessResponse(socket, eventName, result);
  } catch (error) {
    sendErrorResponse(socket, eventName, error);
  }
};

// Socket.io 事件處理
io.on("connection", (socket) => {
  console.log("客戶端已連接:", socket.id);

  // 獲取帳號列表
  socket.on("getAccounts", async (data) => {
    console.log("收到 getAccounts 請求");

    await handleSocketEvent(socket, "getAccounts", () => {
      const accounts = actions.getAccounts().map((acc) => ({
        id: acc.id,
        nickname: acc.nickname,
        isLogin: acc.isLogin,
        nextLoginAt: acc.nextLoginAt,
      }));
      return { accounts };
    });
  });

  // 斷線處理
  socket.on("disconnect", () => {
    console.log("客戶端已斷線:", socket.id);
  });
});

server.listen(9487, () => {
  console.log("Socket.io 服務器運行在端口 9487");
  open("http://localhost:9487/");
});
