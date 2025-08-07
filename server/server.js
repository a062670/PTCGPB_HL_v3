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

  // 設置 socket 實例到 actions
  actions.setSocket(socket);

  // 獲取帳號列表
  socket.on("getAccounts", async (data) => {
    console.log("收到 getAccounts 請求");

    await handleSocketEvent(socket, "getAccounts", () => {
      const accounts = actions.getAccounts();
      return { accounts };
    });
  });

  // 登入
  socket.on("login", async (data) => {
    console.log("收到 login 請求");
    const account = await actions.doLogin(data.id);
    await handleSocketEvent(socket, "login", () => {
      return account;
    });
  });

  // 登出
  socket.on("logout", async (data) => {
    console.log("收到 logout 請求");
    const account = await actions.doLogout(data.id);
    await handleSocketEvent(socket, "logout", () => {
      return account;
    });
  });

  // 加好友
  socket.on("approve", async (data) => {
    console.log("收到 approve 請求");
    const account = await actions.doApprove(data.id);
    await handleSocketEvent(socket, "approve", () => {
      return account;
    });
  });

  // 停止加好友
  socket.on("stopApprove", async (data) => {
    console.log("收到 stopApprove 請求");
    const account = await actions.doStopApprove(data.id);
    await handleSocketEvent(socket, "stopApprove", () => {
      return account;
    });
  });

  // 刪除所有好友
  socket.on("deleteAllFriends", async (data) => {
    console.log("收到 deleteAllFriends 請求");
    const account = await actions.doDeleteAllFriends(data.id);
    await handleSocketEvent(socket, "deleteAllFriends", () => {
      return account;
    });
  });

  // 取得得卡列表
  socket.on("getFeedList", async (data) => {
    console.log("收到 getFeedList 請求");
    const feedList = await actions.doGetFeedList(data.id);
    await handleSocketEvent(socket, "getFeedList", () => {
      return feedList;
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
