const { default: inquirer } = require("inquirer");
const Grpc = require("../lib/Grpc.js");
const Login = require("../steps/Login.js");
const SystemClient = require("../steps/SystemClient.js");
const PlayerProfileClient = require("../steps/PlayerProfileClient.js");
const OpenPack = require("../steps/OpenPack.js");
const FeedClient = require("../steps/FeedClient.js");
const FriendClient = require("../steps/FriendClient.js");

const mainConfig = require("../config/main.json");

Grpc.setMaxRetries(1);

let account = mainConfig.testAccount;
let nickname = "";
let headers = {};
let language = "LANGUAGE_CN";
let packId = "AN009_0020_00_000";
let productId = "PC_PS_2507000_01_02_01";

async function setAccount() {
  const { accountStr } = await inquirer.prompt([
    {
      type: "input",
      name: "accountStr",
      message: "帳號({id:id,password:password}):",
    },
  ]);
  try {
    account = JSON.parse(accountStr);
    console.log("👋 切換帳號成功！");
    console.log(account);
  } catch (error) {
    console.error(error);
    console.log("👋 切換帳號失敗！");
  }
}

async function login() {
  // 註冊/登入
  const loginResponse = await Login.login(account);
  // console.log(loginResponse);
  if (!loginResponse.idToken || !loginResponse.user?.deviceAccounts.length) {
    throw new Error("login failed");
  }
  const idToken = loginResponse.idToken;
  if (!account) {
    account = loginResponse.user.deviceAccounts[0];
    console.log("👋 註冊成功！");
    console.log(account);
  }

  // 遊戲登入
  const authorizeV1Response = await SystemClient.AuthorizeV1(headers, idToken);
  headers["x-takasho-session-token"] = authorizeV1Response.data.sessionToken;
  headers["x-takasho-request-master-memory-aladdin-hash"] =
    authorizeV1Response.headers[
      "x-takasho-response-master-memory-aladdin-hash"
    ];
  // await SystemClient.LoginV1(headers, language);
  console.log("👋 登入成功！");
}

async function getProfile() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const profileResponse = await PlayerProfileClient.MyProfileV1(headers);
  const friendId = profileResponse.data.profile.profileSpine.friendId.replace(
    /-/g,
    ""
  );
  nickname = profileResponse.data.profile.profileSpine.nickname;
  console.log("nickname:", nickname);
  console.log("friendId:", friendId);
}

async function openPack() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const openPackResponse = await OpenPack.openPack(
    {
      headers,
      nickname,
    },
    packId,
    productId,
    language,
    false
  );
  console.log(openPackResponse);
}

async function share() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const { transactionId } = await inquirer.prompt([
    { type: "input", name: "transactionId", message: "transactionId:" },
  ]);
  await FeedClient.ShareV1(headers, transactionId);
  console.log("👋 分享成功！");
}

async function addFriend() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const { friendId } = await inquirer.prompt([
    { type: "input", name: "friendId", message: "friendId:" },
  ]);

  const searchResult = await FriendClient.SearchV1(headers, friendId);
  if (
    searchResult.data.resultsList.length <= 0 ||
    searchResult.data.resultsList[0].friendStatus === 1
  ) {
    // 已經是好友
    console.log("👋 已經是好友！");
    return;
  }
  const playerId = searchResult.data.resultsList[0].playerId;

  await FriendClient.SendRequestsV1(headers, playerId);
  console.log("👋 申請好友成功！");
}

async function cancelFriendRequest() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await getFriendList();
  const friendIds = friendList.data.sentFriendRequestsList.map(
    (friend) => friend.toPlayerId
  );
  if (friendIds.length <= 0) {
    console.log("👋 沒有已申請好友！");
    return;
  }
  console.log(friendIds);
  await FriendClient.CancelSentRequestsV1(headers, friendIds);
  console.log("👋 取消好友申請成功！");
}

async function rejectFriendRequest() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await getFriendList();
  const friendIds = friendList.data.receivedFriendRequestsList.map(
    (friend) => friend.fromPlayerId
  );
  if (friendIds.length <= 0) {
    console.log("👋 沒有待回復好友申請！");
    return;
  }
  // console.log(friendIds);
  await FriendClient.RejectRequestsV1(headers, friendIds);
  console.log("👋 拒絕好友申請成功！");
}

async function approveFriendRequest() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await getFriendList();
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
      await FriendClient.ApproveRequestV1(headers, friendId);
    } catch {}
    console.log(`${Number(idx) + 1}/${friendIds.length}`);
  }
  console.log("👋 接受好友申請成功！");
}

async function clearFriendList() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await getFriendList();

  const friendIds = friendList.data.friendsList.map(
    (friend) => friend.playerId
  );
  if (friendIds.length > 0) {
    await FriendClient.DeleteV1(headers, friendIds);
  }
  console.log("👋 清空好友列表成功！");
}

async function getFriendList() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const friendList = await FriendClient.ListV1(headers);
  console.log("好友列表:", friendList.data.friendsList.length);
  console.log("待回復:", friendList.data.receivedFriendRequestsList.length);
  console.log("已申請:", friendList.data.sentFriendRequestsList.length);
  return friendList;
}

async function getFeedList() {
  if (!headers["x-takasho-session-token"]) {
    console.log("👋 請先登入！");
    return;
  }
  const renewTimelineV1Response = await FeedClient.RenewTimelineV1(headers);
  const list = renewTimelineV1Response.data.timeline.someoneFeedsList.filter(
    (feed) => feed.player.isFriend
  );
  list.forEach((feed) => {
    console.log(feed.someoneFeedId);
    console.log(feed.player.nickname);
    console.log(feed.contents.cardsList.map((card) => card.cardId).join(","));
    console.log(feed.player.isFriend);
    console.log("--------------------------------");
  });
  const renewAfter = renewTimelineV1Response.data.timeline.renewAfter.seconds;
  console.log(new Date(renewAfter * 1000).toLocaleString());
}

async function mainMenu() {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "====== 選單 ======",
        choices: [
          { name: "1. 切換帳號", value: "1" },
          { name: "2. 登入", value: "2" },
          { name: "3. 註冊新帳號(X)", value: "3" },
          { name: "4. 取得個資", value: "4" },
          { name: "5. 開包", value: "5" },
          { name: "6. 分享", value: "6" },
          { name: "7. 申請好友", value: "7" },
          { name: "8. 取消好友申請", value: "8" },
          { name: "9. 拒絕好友申請", value: "9" },
          { name: "a. 接受好友申請", value: "a" },
          { name: "b. 清空好友列表", value: "b" },
          { name: "c. 得卡列表", value: "c" },
          { name: "q. 離開", value: "q" },
        ],
      },
    ]);

    switch (action) {
      case "1":
        await setAccount();
        break;
      case "2":
        await login();
        break;
      case "3":
        // await createAccount();
        break;
      case "4":
        await getProfile();
        break;
      case "5":
        await openPack();
        break;
      case "6":
        await share();
        break;
      case "7":
        await addFriend();
        break;
      case "8":
        await cancelFriendRequest();
        break;
      case "9":
        await rejectFriendRequest();
        break;
      case "a":
        await approveFriendRequest();
        break;
      case "b":
        await clearFriendList();
        break;
      case "c":
        await getFeedList();
        break;
      case "q":
        console.log("👋 離開，感謝使用！");
        return;
    }
  }
}

async function main() {
  await mainMenu();
}
main();
