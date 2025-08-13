const Grpc = require("../lib/Grpc.js");

const PlayerResourcesSyncV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/player_resources_sync_v1_pb.js");

const SyncV1 = async (headers, cursor = "") => {
  const request =
    new PlayerResourcesSyncV1Proto.PlayerResourcesSyncV1.Types.Request();

  if (cursor) {
    request.setCursor(cursor);
  }

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "PlayerResources/SyncV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    PlayerResourcesSyncV1Proto.PlayerResourcesSyncV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  SyncV1,
};
