const { sleep } = require("./lib/Units.js");
const Grpc = require("./lib/Grpc.js");
const Login = require("./steps/Login.js");
const SystemClient = require("./steps/SystemClient.js");
const PlayerProfileClient = require("./steps/PlayerProfileClient.js");
const FriendClient = require("./steps/FriendClient.js");

const mainConfig = require("./config/main.json");

Grpc.setMaxRetries(1);

let accounts = mainConfig.deviceAccounts.map((acc) => ({
  ...acc,
  headers: {},
  nickname: "",
  nextLoginAt: 0,
  isLogin: false,
}));

async function login(account) {
  if (!account) {
    console.log("👋 沒有帳號！");
    return;
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
    console.log("👋 請先登入！");
    return;
  }
  const profileResponse = await PlayerProfileClient.MyProfileV1(
    account.headers
  );
  account.nickname = profileResponse.data.profile.profileSpine.nickname;
}

async function approveFriendRequest(account) {
  if (!account.headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
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
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await FriendClient.ListV1(account.headers);
  console.log(
    account.id,
    friendList.data.friendsList.length,
    friendList.data.receivedFriendRequestsList.length,
    friendList.data.sentFriendRequestsList.length
  );
  return friendList;
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

async function mainMenu() {
  // 1. 登入
  (async () => {
    while (1) {
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
        await sendToDiscord(
          `自動加好友: [${
            account.nickname || account.id.substring(0, 4)
          }] 登入失敗`
        );
        account.nextLoginAt = Date.now() + 1000 * 60 * 1;
        account.isLogin = false;
      }
      await sleep(1000 * 5);
    }
  })();

  for (const account of accounts) {
    (async () => {
      while (1) {
        if (!account.isLogin) {
          await sleep(1000 * 60 * 1);
          continue;
        }
        try {
          await approveFriendRequest(account);
        } catch (error) {
          await sendToDiscord(`自動加好友: [${account.nickname}] 疑似搶登`);
          // 搶登等10分鐘
          account.nextLoginAt = Date.now() + 1000 * 60 * 10;
          account.isLogin = false;
        }
        await sleep(1000 * 5);
      }
    })();
  }
}

async function main() {
  await mainMenu();
}
main();
