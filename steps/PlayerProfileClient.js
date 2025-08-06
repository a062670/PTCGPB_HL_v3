const Grpc = require("../lib/Grpc.js");

const SaveMyProfileProto = require("../generated/takasho/schema/lettuce_server/player_api/save_my_profile_v1_pb.js");
const MyProfileProto = require("../generated/takasho/schema/lettuce_server/player_api/my_profile_v1_pb.js");

const SaveMyProfileV1 = async (
  headers,
  nickname,
  iconId = "PROFILE_ICON_100150_SAKAKI",
  messageId = "PROFILE_MESSAGE_1"
) => {
  const request = new SaveMyProfileProto.SaveMyProfileV1.Types.Request();
  request.setNickname(nickname);
  request.setIconId(iconId);
  request.setEmblemIdsList([]);
  request.setMessageId(messageId);
  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest(
    "PlayerProfile/SaveMyProfileV1",
    headers,
    bytes,
    false
  );

  return;
};

const MyProfileV1 = async (headers) => {
  const request = new MyProfileProto.MyProfileV1.Types.Request();
  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "PlayerProfile/MyProfileV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    MyProfileProto.MyProfileV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  SaveMyProfileV1,
  MyProfileV1,
};
