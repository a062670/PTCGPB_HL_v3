const grpc = require("@grpc/grpc-js");
const { createUuidV4, sleep } = require("./Units.js");
const { encrypt, decrypt } = require("./packer");
const {
  getGrpcClient,
  initializeProxyList,
  rotateProxy,
  getCurrentProxy,
  closeAllClients,
} = require("./client.js");
const staticConfig = require("../config/static.json");
const mainConfig = require("../config/main.json");
const methodPathPrefix = "/takasho.schema.lettuce_server.player_api.";

let proxyRotationTimer = null;

// 初始化proxy輪換
const initializeProxyRotation = () => {
  // 清除現有的定時器
  if (proxyRotationTimer) {
    clearInterval(proxyRotationTimer);
  }

  const proxyList = mainConfig.proxyList || [];

  // 初始化client.js中的proxy列表
  initializeProxyList(proxyList);

  // 如果proxyList為空或不存在，不啟用proxy輪換
  if (!proxyList || proxyList.length === 0) {
    console.log("🔧 Proxy列表為空，不啟用proxy輪換");
    return;
  }

  console.log(`🔧 啟用proxy輪換，共${proxyList.length}個proxy，每分鐘切換一次`);

  // 設置定時器，每15秒切換一次
  proxyRotationTimer = setInterval(() => {
    rotateProxy();
  }, 15 * 1000);
};

// 停止proxy輪換
const stopProxyRotation = () => {
  if (proxyRotationTimer) {
    clearInterval(proxyRotationTimer);
    proxyRotationTimer = null;
    console.log("🔧 停止proxy輪換");
  }
};

// 初始化proxy輪換
initializeProxyRotation();

// 在程序退出時清理定時器和客戶端
const cleanup = () => {
  stopProxyRotation();
  closeAllClients();
};

process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

let maxRetries = 5;
const BASE_DELAY_MS = 2000; // 基礎延遲 2 秒

const baseMetadata = new grpc.Metadata();
for (const key in staticConfig.headers) {
  baseMetadata.add(key, staticConfig.headers[key]);
}

const setMaxRetries = (retries) => {
  maxRetries = retries;
};

const doGrpcRequestOnce = (
  methodPath,
  headers,
  body,
  isNeedResponse = true
) => {
  const client = getGrpcClient();

  // clone baseMetadata
  const metadata = baseMetadata.clone();
  for (const key in headers) {
    // 更新
    metadata.set(key, headers[key]);
  }
  metadata.set("x-takasho-request-id", createUuidV4());
  metadata.set("x-takasho-idempotency-key", createUuidV4());

  return new Promise(async (resolve, reject) => {
    try {
      const encryptedRequestBuffer = await encrypt(body);
      let responseMetadata = null;
      const call = client.makeUnaryRequest(
        `${methodPathPrefix}${methodPath}`,
        (arg) => arg,
        async (buffer) => {
          try {
            return isNeedResponse ? await decrypt(buffer) : buffer;
          } catch (decryptError) {
            console.error(
              `解密響應失敗 [${methodPath}]:`,
              decryptError.message
            );
            throw decryptError;
          }
        },
        encryptedRequestBuffer,
        metadata,
        (error, response) => {
          if (error) {
            return reject({ error, metadata: responseMetadata });
          }
          resolve({ body: response, headers: responseMetadata });
        }
      );

      call.on("metadata", (md) => {
        responseMetadata = md.getMap();
      });
    } catch (encryptError) {
      console.error(`加密請求失敗 [${methodPath}]:`, encryptError.message);
      reject({
        error: {
          code: "ENCRYPTION_ERROR",
          message: encryptError.message,
        },
        metadata: null,
      });
    }
  });
};

const sendGrpcRequest = async (
  methodPath,
  headers,
  body,
  isNeedResponse = true,
  retryCount = 0
) => {
  try {
    return await doGrpcRequestOnce(methodPath, headers, body, isNeedResponse);
  } catch ({ error, metadata }) {
    const currentProxy = getCurrentProxy();
    const proxyInfo = currentProxy
      ? `使用proxy: ${currentProxy}`
      : "不使用proxy";

    console.error(`gRPC Error path:`, methodPath);
    console.error(`gRPC Error code:`, error.code);
    console.error(`🔧 當前${proxyInfo}`);
    console.debug(`Metadata:`, metadata);

    // 處理加密/解密錯誤
    if (error.code === "ENCRYPTION_ERROR") {
      console.error(`🔐 加密/解密錯誤:`, error.message);
      // 對於加密錯誤，我們不重試，直接拋出錯誤
      throw new Error(`加密/解密失敗: ${error.message}`);
    }

    const fatalCodes = [grpc.status.DATA_LOSS];
    const retryableCodes = [
      grpc.status.UNAVAILABLE,
      grpc.status.RESOURCE_EXHAUSTED,
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.ABORTED,
      grpc.status.INTERNAL,
    ];

    if (error.code === grpc.status.PERMISSION_DENIED) {
      console.warn(`🛑 PERMISSION_DENIED，等待 5 分鐘後再重試...`);
      if (retryCount !== maxRetries) {
        await sleep(5 * 60 * 1000); // 5 分鐘
      }
    }

    if (fatalCodes.includes(error.code)) {
      console.warn("❌ Fatal error, closing client");
      getGrpcClient().close(); // 或另傳 client 進來
      throw error.message;
    }

    if (retryableCodes.includes(error.code) && retryCount < maxRetries) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount); // 1s → 2s → 4s
      console.warn(`🔁 Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
      return sendGrpcRequest(
        methodPath,
        headers,
        body,
        isNeedResponse,
        retryCount + 1
      );
    }
    if (retryCount === maxRetries) {
      console.warn("重試次數達到上限");
    }

    throw error.message;
  }
};

module.exports = {
  setMaxRetries,
  sendGrpcRequest,
  getCurrentProxy,
  stopProxyRotation,
  initializeProxyRotation,
};
