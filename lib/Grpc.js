const grpc = require("@grpc/grpc-js");
const {
  createUuidV4,
  sleep,
  getIndexFromThreadContext,
} = require("./Units.js");
const { encrypt, decrypt } = require("./packer");
const { getGrpcClient } = require("./client.js");
const staticConfig = require("../config/static.json");
const methodPathPrefix = "/takasho.schema.lettuce_server.player_api.";

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
    const encryptedRequestBuffer = await encrypt(body);
    let responseMetadata = null;
    const call = client.makeUnaryRequest(
      `${methodPathPrefix}${methodPath}`,
      (arg) => arg,
      async (buffer) => (isNeedResponse ? await decrypt(buffer) : buffer),
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
    const index = getIndexFromThreadContext();
    console.error(`index: ${index} gRPC Error path:`, methodPath);
    console.error(`index: ${index} gRPC Error code:`, error.code);
    console.debug(`index: ${index} Metadata:`, metadata);

    const fatalCodes = [grpc.status.DATA_LOSS];
    const retryableCodes = [
      grpc.status.UNAVAILABLE,
      grpc.status.RESOURCE_EXHAUSTED,
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.ABORTED,
      grpc.status.INTERNAL,
    ];

    if (error.code === grpc.status.PERMISSION_DENIED) {
      console.warn(
        `index: ${index} 🛑 PERMISSION_DENIED，等待 5 分鐘後再重試...`
      );
      await sleep(5 * 60 * 1000); // 5 分鐘
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
};
