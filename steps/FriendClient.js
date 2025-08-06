const Grpc = require("../lib/Grpc.js");

const FriendSearchProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_search_v1_pb.js");
const FriendSendRequestsProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_send_requests_v1_pb.js");
const FriendListProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_list_v1_pb.js");
const FriendDeleteProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_delete_v1_pb.js");
const FriendCancelSentRequestsProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_cancel_sent_requests_v1_pb.js");
const FriendRejectRequestsProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_reject_requests_v1_pb.js");
const FriendApproveRequestProto = require("../generated/takasho/schema/lettuce_server/player_api/friend_approve_request_v1_pb.js");

const SearchV1 = async (headers, friendId) => {
  const request = new FriendSearchProto.FriendSearchV1.Types.Request();
  request.setSearchFriendId(friendId);
  request.setSearchPlayerName("");

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest("Friend/SearchV1", headers, bytes);

  // 反序列化
  const resultBody =
    FriendSearchProto.FriendSearchV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const SendRequestsV1 = async (headers, playerIds) => {
  if (!Array.isArray(playerIds)) {
    playerIds = [playerIds];
  }
  const request =
    new FriendSendRequestsProto.FriendSendRequestsV1.Types.Request();
  request.setReceiverPlayerIdsList(playerIds);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest("Friend/SendRequestsV1", headers, bytes, false);

  return;
};

const ListV1 = async (headers) => {
  const request = new FriendListProto.FriendListV1.Types.Request();

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest("Friend/ListV1", headers, bytes);

  // 反序列化
  const resultBody =
    FriendListProto.FriendListV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const DeleteV1 = async (headers, playerIds) => {
  const request = new FriendDeleteProto.FriendDeleteV1.Types.Request();
  request.setDeletePlayerIdsList(playerIds);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest("Friend/DeleteV1", headers, bytes, false);

  return;
};

const CancelSentRequestsV1 = async (headers, playerIds) => {
  const request =
    new FriendCancelSentRequestsProto.FriendCancelSentRequestsV1.Types.Request();
  request.setReceiverPlayerIdsList(playerIds);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest(
    "Friend/CancelSentRequestsV1",
    headers,
    bytes,
    false
  );

  return;
};

const RejectRequestsV1 = async (headers, playerIds) => {
  const request =
    new FriendRejectRequestsProto.FriendRejectRequestsV1.Types.Request();
  request.setSenderPlayerIdsList(playerIds);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest("Friend/RejectRequestsV1", headers, bytes, false);

  return;
};

const ApproveRequestV1 = async (headers, playerId) => {
  const request =
    new FriendApproveRequestProto.FriendApproveRequestV1.Types.Request();
  request.setSenderPlayerId(playerId);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest("Friend/ApproveRequestV1", headers, bytes, false);

  return;
};

module.exports = {
  SearchV1,
  SendRequestsV1,
  ListV1,
  DeleteV1,
  CancelSentRequestsV1,
  RejectRequestsV1,
  ApproveRequestV1,
};
