const Grpc = require("../lib/Grpc.js");
const PackGetDetailV2Proto = require("../generated/takasho/schema/lettuce_server/player_api/pack_get_detail_v2_pb.js");
const PackGetPackPowerV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/pack_get_pack_power_v1_pb.js");

const { getCachedBytes } = require("../lib/Units.js");

const GetDetailV2 = async (headers, packId) => {
  const bytes = getCachedBytes(["Pack/GetDetailV2", packId], () => {
    const request = new PackGetDetailV2Proto.PackGetDetailV2.Types.Request();
    request.setPackId(packId);
    const bytes = request.serializeBinary();
    return bytes;
  });
  const result = await Grpc.sendGrpcRequest("Pack/GetDetailV2", headers, bytes);

  // 反序列化
  const resultBody =
    PackGetDetailV2Proto.PackGetDetailV2.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const GetPackPowerV1 = async (headers) => {
  const request =
    new PackGetPackPowerV1Proto.PackGetPackPowerV1.Types.Request();

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "Pack/GetPackPowerV1",
    headers,
    bytes
  );
  const resultBody =
    PackGetPackPowerV1Proto.PackGetPackPowerV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  GetDetailV2,
  GetPackPowerV1,
};
