const { v4: uuidv4 } = require("uuid");
const threadContext = require("./threadContext.js");
function createUuidV4() {
  return uuidv4();
}

function createRandomHexString(length = 32) {
  return [...Array(length)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("")
    .toUpperCase();
}

/** 取得商店年月ID */
function getShopYearMonthId() {
  const now = new Date();
  // 偏移 UTC-6
  const utcMinus6 = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  // 拿年份的後兩位
  const year = utcMinus6.getUTCFullYear() % 100;
  const month = (utcMinus6.getUTCMonth() + 1).toString().padStart(2, "0");
  // 組合成 YYMM
  const result = `${year.toString().padStart(2, "0")}${month}`;

  return result;
}

function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let isOnStop = false;
function stopProcess() {
  if (isOnStop == true) {
    // 一次只會觸發一個停止
    return;
  }
  isOnStop = true;
  if (process) {
    process.exit(1);
  }
}

const saveBytes = {};

const getCachedBytes = (keys, callback) => {
  const key = keys.map((v) => String(v)).join("|");
  if (!saveBytes[key]) {
    saveBytes[key] = callback();
    // console.warn("新增到cache: ", key);
  }
  return saveBytes[key];
};

const getIndexFromThreadContext = () => {
  const store = threadContext.getStore();
  if (!store || typeof store.threadId !== "number") {
    return 0;
  }
  return Math.floor((store.threadId - 1) / 15); // 每15個建立一個grpc client
};

module.exports = {
  createUuidV4,
  getShopYearMonthId,
  sleep,
  stopProcess,
  createRandomHexString,
  getCachedBytes,
  getIndexFromThreadContext,
};
