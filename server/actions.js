const fs = require("fs");
const path = require("path");

const { sleep } = require("../lib/Units.js");
const { heartbeat } = require("../lib/packer/index.js");
const Grpc = require("../lib/Grpc.js");
const Login = require("../steps/Login.js");
const SystemClient = require("../steps/SystemClient.js");
const PlayerProfileClient = require("../steps/PlayerProfileClient.js");
const OpenPack = require("../steps/OpenPack.js");
const FeedClient = require("../steps/FeedClient.js");
const FriendClient = require("../steps/FriendClient.js");
const PresentBoxClient = require("../steps/PresentBoxClient.js");
const DeckClient = require("../steps/DeckClient.js");
const SoloBattleClient = require("../steps/SoloBattleClient.js");
const PackClient = require("../steps/PackClient.js");
const ItemShopClient = require("../steps/ItemShopClient.js");
const PlayerResourcesClient = require("../steps/PlayerResourcesClient.js");

const mainConfig = require("../config/main.json");
const eventBattleConfig = require("../config/eventBattle.json");
const packConfig = require("../config/pack.json");

Grpc.setMaxRetries(1);

let accounts;
let socketInstance = null; // 用於存儲 socket 實例

exports.init = () => {
  accounts = mainConfig.deviceAccounts.map((acc) => ({
    ...acc,
    headers: {},
    nickname: "",
    friendId: "",
    nextLoginAt: Date.now() + 1000 * 60 * 60 * 24 * 100,
    isLogin: false,
    isApprove: false,
    friendList: {
      count: [0, 0, 0],
      friendsList: [],
      sentFriendRequestsList: [],
      receivedFriendRequestsList: [],
    },
    lastHeartbeat: 0,
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

exports.doGetPlayerResources = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getPlayerResources(account);
};

exports.doApprove = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  await rejectFriendRequest(account);
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

exports.doGetFriendList = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getFriendList(account);
};

exports.doDeleteFriend = async (accountId, playerId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  await deleteFriend(account, playerId);
  return;
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

/** 補充得卡力 */
exports.doHealChallengePower = async (accountId, type, amount, vcAmount) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await healChallengePower(account, type, amount, vcAmount);
};

/** 開始得卡 */
exports.doFeedSnoop = async (
  accountId,
  feedId,
  usedForRevivalChallengePower
) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await feedSnoop(account, feedId, usedForRevivalChallengePower);
};

/** 得卡選卡 */
exports.doFeedChallenge = async (accountId, feedId, challengeType) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await feedChallenge(account, feedId, challengeType);
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

/** 取得牌組列表 */
exports.doGetDeckList = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getDeckList(account);
};

/** 取得事件能量 */
exports.doGetEventPowers = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  const eventPowers = await getEventPowers(account, [eventBattleConfig.id]);
  if (!eventPowers[0]) {
    return null;
  }
  return {
    eventPower: eventPowers[0],
    event: eventBattleConfig,
  };
};

/** 開始事件戰鬥 */
exports.doStartEventBattle = async (accountId, battleId, myDeckId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await startEventBattle(account, battleId, myDeckId);
};

/** 結束事件戰鬥 */
exports.doFinishEventBattle = async (accountId, battleId, myDeckId, token) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  await finishEventBattle(account, battleId, myDeckId, token);
  return;
};

/** 取得開包力 */
exports.doGetPackPower = async (accountId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  const packPower = await getPackPower(account);
  return {
    packPower,
    pack: packConfig,
  };
};

/** 開包 */
exports.doOpenPack = async (accountId, packId, productId, packPowerType) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await openPack(account, packId, productId, packPowerType);
};

/** 取得商店購買摘要 */
exports.doGetItemShopPurchaseSummaries = async (accountId, productId) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  return await getItemShopPurchaseSummaries(account, productId);
};

/** 購貸商店商品 */
exports.doPurchaseItemShop = async (
  accountId,
  productId,
  ticketAmount,
  times
) => {
  const account = accounts.find((acc) => acc.id === accountId);
  if (!account) {
    throw new Error("account not found");
  }
  await purchaseItemShop(account, productId, ticketAmount, times);
  return;
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
  account.friendId = profileResponse.data.profile.profileSpine.friendId.replace(
    /-/g,
    ""
  );
}

async function getPlayerResources(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const data = {
    cardStocks: [],
    packPowerChargers: [],
    challengePowerChargers: [],
  };
  let hasNext = true;
  let cursor = "";
  while (hasNext) {
    console.log("cursor:", cursor);
    const playerResources = await PlayerResourcesClient.SyncV1(
      account.headers,
      cursor
    );
    data.cardStocks.push(
      ...playerResources.data.playerResources.cardStocksList.map(
        (card) => card.cardId
      )
    );
    data.packPowerChargers.push(
      ...playerResources.data.playerResources.packPowerChargersList
    );
    data.challengePowerChargers.push(
      ...playerResources.data.playerResources.challengePowerChargersList
    );
    hasNext = playerResources.data.hasNext;
    cursor = playerResources.data.nextCursor;
  }
  return data;
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
    } catch {
      console.log("👋 接受好友申請失敗，跳出迴圈！");
      break;
    }
    // console.log(`${account.id} ${Number(idx) + 1}/${friendIds.length}`);
  }
  console.log("👋 接受好友申請成功！");
}

async function getFriendList(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const friendList = await FriendClient.ListV1(account.headers);
  account.friendList = {
    friendsList: friendList.data.friendsList,
    sentFriendRequestsList: friendList.data.sentFriendRequestsList,
    receivedFriendRequestsList: friendList.data.receivedFriendRequestsList,
    count: [
      friendList.data.friendsList.length,
      friendList.data.sentFriendRequestsList.length,
      friendList.data.receivedFriendRequestsList.length,
    ],
  };
  console.log(account.id, account.friendList.count.join("/"));
  emitToSocket("updateAccount", filterAccount(account));
  return friendList;
}

async function deleteFriend(account, playerId) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  await FriendClient.DeleteV1(account.headers, [playerId]);
  await getFriendList(account);
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

async function rejectFriendRequest(account) {
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
  await FriendClient.RejectRequestsV1(account.headers, friendIds);
  console.log("👋 拒絕好友申請成功！");
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
      cardsList: feed.contents.cardsList,
      isFriend: feed.player.isFriend,
      challengeInfo: feed.challengeInfo,
      disable: feed.contents.cardsList.some((card) => card.disable),
    }));
  const renewAfter = renewTimelineV1Response.data.timeline.renewAfter.seconds;
  return {
    list,
    renewAfter,
    challengePower: renewTimelineV1Response.data.challengePower,
  };
}

/** 補充得卡力 */
async function healChallengePower(account, type, amount, vcAmount) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  await FeedClient.HealChallengePowerV1(
    account.headers,
    type,
    amount,
    vcAmount
  );
}

/** 開始得卡 */
async function feedSnoop(account, feedId, usedForRevivalChallengePower) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const snoopResponse = await FeedClient.SnoopV1(
    account.headers,
    feedId,
    usedForRevivalChallengePower
  );
  console.log(snoopResponse.data.timeline.someoneFeedsList);
  return snoopResponse.data.timeline.someoneFeedsList.find((feed) => {
    console.log(feed.someoneFeedId, feedId);
    return feed.someoneFeedId === feedId;
  });
}

/** 得卡選卡 */
async function feedChallenge(account, feedId, challengeType) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const challengeResponse = await FeedClient.ChallengeV2(
    account.headers,
    feedId,
    challengeType
  );
  return challengeResponse.data.pickedCardsList;
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

async function getDeckList(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const deckList = await DeckClient.GetListV1(account.headers);
  return deckList.data.decksList;
}

async function getEventPowers(account, eventIds) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const eventPowers = await SoloBattleClient.GetEventPowersV1(
    account.headers,
    eventIds
  );
  return eventPowers.data.eventPowersList;
}

async function startEventBattle(account, battleId, myDeckId) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const eventBattle = await SoloBattleClient.StartEventBattleV1(
    account.headers,
    battleId,
    myDeckId
  );
  return eventBattle.data;
}

async function finishEventBattle(account, battleId, myDeckId, token) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  await SoloBattleClient.FinishEventBattleV1(
    account.headers,
    battleId,
    myDeckId,
    token
  );
  return;
}

/** 取得開包力 */
async function getPackPower(account) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const packPower = await PackClient.GetPackPowerV1(account.headers);
  return packPower.data;
}

/** 開包 */
async function openPack(account, packId, productId, packPowerType) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const openPackResponse = await OpenPack.openPack(
    account.headers,
    packId,
    productId,
    packPowerType
  );
  return openPackResponse;
}

/** 取得商店購買摘要 */
async function getItemShopPurchaseSummaries(account, productId) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const itemShopPurchaseSummaries = await ItemShopClient.GetPurchaseSummariesV1(
    account.headers,
    productId
  );
  return itemShopPurchaseSummaries.data;
}

/** 購買商店商品 */
async function purchaseItemShop(account, productId, ticketAmount, times) {
  if (!account.headers["x-takasho-session-token"]) {
    throw new Error("請先登入！");
  }
  const purchaseItemShopResponse = await ItemShopClient.PurchaseV1(
    account.headers,
    productId,
    ticketAmount,
    times
  );
  return;
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
    lastHeartbeat: account.lastHeartbeat,
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
          // 心跳 1 分鐘一次，好友 >=90 不送心跳
          if (
            account.friendList.count[0] < 90 &&
            Date.now() - account.lastHeartbeat > 1000 * 60
          ) {
            console.log("heartbeat", account.friendId);
            heartbeat(account.friendId);
            account.lastHeartbeat = Date.now();
          }
          const startAt = Date.now();
          try {
            await approveFriendRequest(account);
          } catch (error) {
            console.error(`加好友錯誤 [${account.id}]:`, error.message);
            await sendToDiscord(`自動加好友: [${account.nickname}] 疑似搶登`);
            // 搶登等10分鐘
            account.nextLoginAt =
              Date.now() + 1000 * 60 * (mainConfig.reLoginWaitTime || 10);
            account.isLogin = false;
            // 通知 socket
            emitToSocket("updateAccount", filterAccount(account));
          }
          await sleep(Math.max(1, 5000 - (Date.now() - startAt)));
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
