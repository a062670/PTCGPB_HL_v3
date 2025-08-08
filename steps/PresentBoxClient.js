const Grpc = require("../lib/Grpc.js");

const PresentBoxListV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/present_box_list_v1_pb.js");
const PresentBoxReceiveV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/present_box_receive_v1_pb.js");

const ListV1 = async (headers) => {
  const request = new PresentBoxListV1Proto.PresentBoxListV1.Types.Request();

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "PresentBox/ListV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    PresentBoxListV1Proto.PresentBoxListV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const ReceiveV1 = async (headers, presentBoxIds) => {
  const request =
    new PresentBoxReceiveV1Proto.PresentBoxReceiveV1.Types.Request();
  if (presentBoxIds.length === 1) {
    request.setPresentId(presentBoxIds[0]);
  } else {
    request.setPresentIdsList(presentBoxIds);
  }

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "PresentBox/ReceiveV1",
    headers,
    bytes
  );

  const resultBody =
    PresentBoxReceiveV1Proto.PresentBoxReceiveV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  ListV1,
  ReceiveV1,
};
