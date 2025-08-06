const grpc = require("@grpc/grpc-js");
const { getIndexFromThreadContext } = require("./Units");
const target = "player-api-prod.app-41283.com:443";

const grpcClients = [];

function getGrpcClient() {
  const index = getIndexFromThreadContext(); // 每15個建立一個grpc client
  const grpcClient = grpcClients[index];
  if (
    grpcClient &&
    grpcClient.getChannel().getConnectivityState(false) !==
      grpc.connectivityState.SHUTDOWN
  ) {
    return grpcClient;
  }
  console.log("初始化grpc");
  grpcClients[index] = new grpc.Client(target, grpc.credentials.createSsl());
  return grpcClients[index];
}

module.exports = {
  getGrpcClient,
};
