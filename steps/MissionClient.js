const Grpc = require("../lib/Grpc.js");

const MissionCompleteProto = require("../generated/takasho/schema/lettuce_server/player_api/mission_complete_v2_pb.js");
const MissionCompleteGroupRewardStepProto = require("../generated/takasho/schema/lettuce_server/player_api/mission_complete_group_reward_step_v1_pb.js");
const MissionGetGroupRewardStepStatesProto = require("../generated/takasho/schema/lettuce_server/player_api/mission_get_group_reward_step_states_v1_pb.js");
const MissionIsCompletedProto = require("../generated/takasho/schema/lettuce_server/player_api/mission_is_completed_v1_pb.js");

const { getCachedBytes } = require("../lib/Units.js");

const CompleteV2 = async (headers, missionIds) => {
  const bytes = getCachedBytes(["Mission/CompleteV2", missionIds], () => {
    const request = new MissionCompleteProto.MissionCompleteV2.Types.Request();
    request.setMissionIdsList(missionIds);

    return request.serializeBinary();
  });

  await Grpc.sendGrpcRequest("Mission/CompleteV2", headers, bytes, false);

  return;
};

const CompleteGroupRewardStepV1 = async (headers, rewardStepIds) => {
  const request =
    new MissionCompleteGroupRewardStepProto.MissionCompleteGroupRewardStepV1.Types.Request();
  request.setMissionGroupRewardStepIdsList(rewardStepIds);

  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "Mission/CompleteGroupRewardStepV1",
    headers,
    bytes,
    false
  );

  return;
};

const GetGroupRewardStepStatesV1 = async (headers, rewardStepIds) => {
  const request =
    new MissionGetGroupRewardStepStatesProto.MissionGetGroupRewardStepStatesV1.Types.Request();
  request.setMissionGroupRewardStepIdsList(rewardStepIds);

  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "Mission/GetGroupRewardStepStatesV1",
    headers,
    bytes
  );

  const resultBody =
    MissionGetGroupRewardStepStatesProto.MissionGetGroupRewardStepStatesV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const IsCompletedV1 = async (headers, missionIds) => {
  const request =
    new MissionIsCompletedProto.MissionIsCompletedV1.Types.Request();
  request.setMissionIdsList(missionIds);

  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "Mission/IsCompletedV1",
    headers,
    bytes
  );

  const resultBody =
    MissionIsCompletedProto.MissionIsCompletedV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  CompleteV2,
  CompleteGroupRewardStepV1,
  GetGroupRewardStepStatesV1,
  IsCompletedV1,
};
