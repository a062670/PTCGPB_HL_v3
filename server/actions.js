const fs = require("fs");
const path = require("path");

const { sleep } = require("../lib/Units.js");
const Grpc = require("../lib/Grpc.js");
const Login = require("../steps/Login.js");
const SystemClient = require("../steps/SystemClient.js");
const PlayerProfileClient = require("../steps/PlayerProfileClient.js");
const OpenPack = require("../steps/OpenPack.js");
const FeedClient = require("../steps/FeedClient.js");
const FriendClient = require("../steps/FriendClient.js");
const PresentBoxClient = require("../steps/PresentBoxClient.js");

const mainConfig = require("../config/main.json");

Grpc.setMaxRetries(1);

let accounts;
let socketInstance = null; // 用於存儲 socket 實例

exports.init = () => {
  accounts = mainConfig.deviceAccounts.map((acc) => ({
    ...acc,
    headers: {},
    nickname: "",
    nextLoginAt: Date.now() + 1000 * 60 * 60 * 24 * 100,
    isLogin: false,
    isApprove: false,
    friendList: "0/0/0",
  }));
  schedule();
};

// 設置 socket 實例
exports.setSocket = (socket) => {
  socketInstance = socket;
};

exports.getAccounts = () => {
  if (!accounts) {
    console.warn("accounts 未初始化，重新載入配置");
    exports.reloadConfig();
  }
  return (accounts || []).map(filterAccount);
};

exports.doLogin = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }

  await login(account);
  if (!account.nickname) {
    await getProfile(account);
  }

  return filterAccount(account);
};

exports.doLogout = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  account.isLogin = false;
  account.nextLoginAt = Date.now() + 1000 * 60 * 60 * 24 * 100;

  return filterAccount(account);
};

exports.doApprove = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  account.isApprove = true;
  return filterAccount(account);
};

exports.doStopApprove = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  account.isApprove = false;
  return filterAccount(account);
};

exports.doDeleteAllFriends = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  await deleteAllFriends(account);
  return filterAccount(account);
};

exports.doGetFeedList = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getFeedList(account);
};

exports.doGetPresentBoxList = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getPresentBoxList(account);
};

exports.doReceivePresentBox = async (accountId, presentBoxIds) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await receivePresentBox(account, presentBoxIds);
};

// 發送 socket 通知的輔助函數
function emitToSocket(event, data) {
  if (socketInstance) {
    socketInstance.emit(event, data);
  }
}

async function login(account) {
  if (!account) {
    throw new Error("沒有帳號！");
  }
  account.headers = account.headers || {};
  // 登入
  const loginResponse = await Login.login(account);
  if (!loginResponse.idToken || !loginResponse.user?.deviceAccounts.length) {
    throw new Error("login failed");
  }
  const idToken = loginResponse.idToken;

  // 遊戲登入
  const authorizeV1Response = await SystemClient.AuthorizeV1(
    account.headers,
    idToken
  );
  account.headers["x-takasho-session-token"] =
    authorizeV1Response.data.sessionToken;
  account.headers["x-takasho-request-master-memory-aladdin-hash"] =
    authorizeV1Response.headers[
      "x-takasho-response-master-memory-aladdin-hash"
    ];
  account.nextLoginAt = Date.now() + 1000 * 60 * 50;
  account.isLogin = true;
  console.log("👋 登入成功！", account.id);
}

async function getProfile(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const profileResponse = await PlayerProfileClient.MyProfileV1(
    account.headers
  );
  account.nickname = profileResponse.data.profile.profileSpine.nickname;
}

async function approveFriendRequest(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const friendList = await getFriendList(account);
  const friendIds = friendList.data.receivedFriendRequestsList.map(
    (friend) => friend.fromPlayerId
  );
  if (friendIds.length <= 0) {
    console.log("👋 沒有待回復好友申請！");
    return;
  }
  // console.log(friendIds);
  for (const idx in friendIds) {
    const friendId = friendIds[idx];
    try {
      await FriendClient.ApproveRequestV1(account.headers, friendId);
    } catch {}
    // console.log(`${account.id} ${Number(idx) + 1}/${friendIds.length}`);
  }
  console.log("👋 接受好友申請成功！");
}

async function getFriendList(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const friendList = await FriendClient.ListV1(account.headers);
  account.friendList = `${friendList.data.friendsList.length}/${friendList.data.sentFriendRequestsList.length}/${friendList.data.receivedFriendRequestsList.length}`;
  console.log(account.id, account.friendList);
  emitToSocket("updateAccount", filterAccount(account));
  return friendList;
}

async function deleteAllFriends(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const friendList = await getFriendList(account);

  const friendIds = friendList.data.friendsList.map(
    (friend) => friend.playerId
  );
  if (friendIds.length > 0) {
    await FriendClient.DeleteV1(account.headers, friendIds);
  }
  console.log("👋 清空好友列表成功！");
  await getFriendList(account);
}

async function getFeedList(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const renewTimelineV1Response = await FeedClient.RenewTimelineV1(
    account.headers
  );
  const list = renewTimelineV1Response.data.timeline.someoneFeedsList
    // .filter((feed) => feed.player.isFriend)
    .map((feed) => ({
      someoneFeedId: feed.someoneFeedId,
      nickname: feed.player.nickname,
      cardIds: feed.contents.cardsList.map((card) => card.cardId).join(","),
      isFriend: feed.player.isFriend,
    }));
  const renewAfter = renewTimelineV1Response.data.timeline.renewAfter.seconds;
  return {
    list,
    renewAfter,
  };
}

async function getPresentBoxList(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const presentBoxList = await PresentBoxClient.ListV1(account.headers);
  presentBoxList.data.presentsList.forEach((present) => {
    console.log("presentId:", present.presentId);
    console.log(
      "expiredAt:",
      new Date(present.expiredAt.seconds * 1000).toLocaleString()
    );
    console.log("pack:", present.pack);
    console.log("currency:", present.currency);
    console.log("--------------------------------");
  });
  return presentBoxList.data;
}

async function receivePresentBox(account, presentBoxIds) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  if (!presentBoxIds) {
    throw new Error("請輸入禮物 IDs！");
  }
  const receivePresentBoxResponse = await PresentBoxClient.ReceiveV1(
    account.headers,
    presentBoxIds
  );
  if (receivePresentBoxResponse.data.result) {
    const result = receivePresentBoxResponse.data.result;
    console.log("isSuccesse:", result.isSuccesse);
    if (result.itemAcquisitionResult?.acquiredItems?.cardInstancesList) {
      result.itemAcquisitionResult.acquiredItems.cardInstancesList.forEach(
        (card) => {
          console.log("cardId:", card.cardInstance.cardId);
        }
      );
    }
  }
  if (receivePresentBoxResponse.data.resultsList) {
    receivePresentBoxResponse.data.resultsList.forEach((result) => {
      console.log("presentId:", result.presentId);
      console.log("isSuccesse:", result.isSuccesse);
      console.log("--------------------------------");
    });
  }
  return receivePresentBoxResponse.data;
}

async function sendToDiscord(message) {
  if (!mainConfig.webhook) {
    return;
  }
  await fetch(mainConfig.webhook, {
    method: "POST",
    body: JSON.stringify({
      content: message,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// 過濾 account 資訊
function filterAccount(account) {
  return {
    id: account.id,
    nickname: account.nickname,
    isLogin: account.isLogin,
    isApprove: account.isApprove,
    nextLoginAt: account.nextLoginAt,
    friendList: account.friendList,
  };
}

// 排程
function schedule() {
  // 全域未處理的 Promise 拒絕處理
  process.on("unhandledRejection", (reason, promise) => {
    console.error("未處理的 Promise 拒絕:", reason);
    console.error("Promise:", promise);
  });

  // 登入排程
  (async () => {
    while (1) {
      try {
        const account = accounts.find((acc) => acc.nextLoginAt < Date.now());
        if (!account) {
          await sleep(1000 * 60 * 1);
          continue;
        }
        try {
          await login(account);
          if (!account.nickname) {
            await getProfile(account);
          }
        } catch (error) {
          console.error(`登入錯誤 [${account.id}]:`, error.message);
          await sendToDiscord(
            `自動加好友: [${
              account.nickname || account.id.substring(0, 4)
            }] 登入失敗`
          );
          account.nextLoginAt = Date.now() + 1000 * 60 * 1;
          account.isLogin = false;
        }
        await sleep(1000 * 5);
      } catch (error) {
        console.error("登入排程發生未預期錯誤:", error);
        await sleep(1000 * 60 * 5); // 發生錯誤時等待5分鐘
      }
    }
  })();

  // 加好友
  for (const account of accounts) {
    (async () => {
      while (1) {
        try {
          if (!account.isLogin || !account.isApprove) {
            await sleep(1000 * 5);
            continue;
          }
          try {
            await approveFriendRequest(account);
          } catch (error) {
            console.error(`加好友錯誤 [${account.id}]:`, error.message);
            await sendToDiscord(`自動加好友: [${account.nickname}] 疑似搶登`);
            // 搶登等10分鐘
            account.nextLoginAt = Date.now() + 1000 * 60 * 10;
            account.isLogin = false;
            // 通知 socket
            emitToSocket("updateAccount", filterAccount(account));
          }
          await sleep(1000 * 5);
        } catch (error) {
          console.error(
            `帳號 [${account.id}] 加好友排程發生未預期錯誤:`,
            error
          );
          await sleep(1000 * 60 * 5); // 發生錯誤時等待5分鐘
        }
      }
    })();
  }
}
