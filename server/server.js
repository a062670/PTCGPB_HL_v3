const express = require("express");
const session = require("express-session");
const open = require("open");
const { createServer } = require("http");
const { Server } = require("socket.io");
const actions = require("./actions");

const mainConfig = require("../config/main.json");

actions.init();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  // 同源請求，不需要 CORS 配置
});

// 根據配置決定是否啟用 session
let sessionMiddleware = null;
if (mainConfig.auth?.enable) {
  sessionMiddleware = session({
    secret: mainConfig.auth.secret,
    resave: false,
    saveUninitialized: false,
  });

  app.use(sessionMiddleware);
}

// 驗證中間件
const authMiddleware = (req, res, next) => {
  if (
    !mainConfig.auth?.enable ||
    req.path === "/login.html" ||
    req.session?.authenticated
  ) {
    next();
  } else {
    res.redirect("/login.html");
  }
};

app.use(express.json());

// 登入 API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === mainConfig.auth?.username &&
    password === mainConfig.auth?.password
  ) {
    req.session.authenticated = true;
    res.json({ code: 0, message: "success" });
  } else {
    res.status(401).json({ code: 401, message: "error" });
  }
});

// 靜態資源
app.use("/", authMiddleware, express.static("client"));

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

// 根據配置決定是否啟用 Socket.IO 驗證
if (mainConfig.auth?.enable && sessionMiddleware) {
  // 將 session 中間件應用到 Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  // Socket.IO 驗證
  io.use((socket, next) => {
    const session = socket.request.session;
    console.log("Socket session:", session);
    if (session && session.authenticated) {
      next();
    } else {
      next(new Error("Authentication required"));
    }
  });
}

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

  // 取得禮物列表
  socket.on("getPresentBoxList", async (data) => {
    console.log("收到 getPresentBoxList 請求");
    const presentBoxList = await actions.doGetPresentBoxList(data.id);
    await handleSocketEvent(socket, "getPresentBoxList", () => {
      return presentBoxList;
    });
  });

  // 領取禮物
  socket.on("receivePresentBox", async (data) => {
    console.log("收到 receivePresentBox 請求");
    const receivePresentBox = await actions.doReceivePresentBox(
      data.id,
      data.presentBoxIds
    );
    await handleSocketEvent(socket, "receivePresentBox", () => {
      return receivePresentBox;
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
