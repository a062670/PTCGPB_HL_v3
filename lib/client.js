const grpc = require("@grpc/grpc-js");
const target = "player-api-prod.app-41283.com:443";

// 存儲所有proxy對應的grpc客戶端
const grpcClients = new Map();
let proxyList = [];
let currentProxyIndex = 0;

// 初始化proxy列表
function initializeProxyList(proxyArray) {
  proxyList = proxyArray || [];
  currentProxyIndex = 0;

  if (!proxyList || proxyList.length === 0) {
    console.log("🔧 Proxy列表為空，不啟用proxy輪換");
    return;
  }

  console.log(`🔧 初始化proxy列表，共${proxyList.length}個proxy`);

  // 為每個proxy創建對應的grpc客戶端
  proxyList.forEach((proxy, index) => {
    createGrpcClientForProxy(proxy, index);
  });
}

// 為特定proxy創建grpc客戶端
function createGrpcClientForProxy(proxy, index) {
  const credentials = grpc.credentials.createSsl();
  let clientOptions = {};

  if (proxy && proxy.trim() !== "") {
    clientOptions = {
      "grpc.http_proxy": proxy,
      "grpc.https_proxy": proxy,
    };
    console.log(`🔧 為proxy ${index + 1} 創建客戶端: ${proxy}`);
  } else {
    console.log(`🔧 為proxy ${index + 1} 創建客戶端: 不使用proxy`);
  }

  const client = new grpc.Client(target, credentials, clientOptions);
  grpcClients.set(index, client);
}

// 切換到下一個proxy
function rotateProxy() {
  if (!proxyList || proxyList.length === 0) {
    return;
  }

  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
  const currentProxy = proxyList[currentProxyIndex];

  if (!currentProxy || currentProxy.trim() === "") {
    console.log(`🔄 切換到第${currentProxyIndex + 1}個proxy: 不使用proxy`);
  } else {
    console.log(`🔄 切換到第${currentProxyIndex + 1}個proxy: ${currentProxy}`);
  }
}

// 獲取當前應該使用的grpc客戶端
function getGrpcClient() {
  // 測試：直接回傳一個新的客戶端
  return new grpc.Client(target, grpc.credentials.createSsl());

  if (!proxyList || proxyList.length === 0) {
    // 如果沒有proxy列表，創建一個不使用proxy的客戶端
    if (!grpcClients.has(-1)) {
      createGrpcClientForProxy("", -1);
    }
    return grpcClients.get(-1);
  }

  const client = grpcClients.get(currentProxyIndex);
  if (client) {
    return client;
  }

  // 如果客戶端不存在，創建一個
  const currentProxy = proxyList[currentProxyIndex];
  createGrpcClientForProxy(currentProxy, currentProxyIndex);
  return grpcClients.get(currentProxyIndex);
}

// 獲取當前使用的proxy
function getCurrentProxy() {
  if (!proxyList || proxyList.length === 0) {
    return null;
  }
  return proxyList[currentProxyIndex];
}

// 關閉所有客戶端
function closeAllClients() {
  grpcClients.forEach((client, index) => {
    try {
      client.close();
      console.log(`🔧 關閉grpc客戶端 ${index}`);
    } catch (error) {
      console.warn(`關閉grpc客戶端 ${index} 時發生錯誤:`, error.message);
    }
  });
  grpcClients.clear();
}

module.exports = {
  getGrpcClient,
  initializeProxyList,
  rotateProxy,
  getCurrentProxy,
  closeAllClients,
};
