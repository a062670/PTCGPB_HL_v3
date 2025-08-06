const Grpc = require("../lib/Grpc.js");

const FeedRenewTimelineV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/feed_renew_timeline_v1_pb.js");
const FeedSnoopV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/feed_snoop_v1_pb.js");
const FeedChallengeV2Proto = require("../generated/takasho/schema/lettuce_server/player_api/feed_challenge_v2_pb.js");
const FeedTypeProto = require("../generated/takasho/schema/lettuce_server/resource/feed/feed_type_pb.js");
const FeedRevivalItemsProto = require("../generated/takasho/schema/lettuce_server/resource/feed/feed_revival_items_pb.js");
const RevivalClockProto = require("../generated/takasho/schema/lettuce_server/resource/item/revival_clock_pb.js");
const FeedShareV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/feed_share_v1_pb.js");
const { getCachedBytes } = require("../lib/Units.js");
const RenewTimelineV1 = async (headers) => {
  const bytes = getCachedBytes(["Feed/RenewTimelineV1"], () => {
    const request =
      new FeedRenewTimelineV1Proto.FeedRenewTimelineV1.Types.Request();
    return request.serializeBinary();
  });

  const result = await Grpc.sendGrpcRequest(
    "Feed/RenewTimelineV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    FeedRenewTimelineV1Proto.FeedRenewTimelineV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const SnoopV1 = async (headers, feedId) => {
  const request = new FeedSnoopV1Proto.FeedSnoopV1.Types.Request();
  request.setFeedType(FeedTypeProto.FeedType.FEED_TYPE_SOMEONE);
  request.setFeedId(feedId);
  request.setUsedForRevivalChallengePower(1);

  const revivalItems = new FeedRevivalItemsProto.FeedRevivalItems();
  revivalItems.setVcAmount(0);
  const revivalClock = new RevivalClockProto.RevivalClock();
  revivalItems.setRevivalClock(revivalClock);
  request.setRevivalItems(revivalItems);

  const bytes = request.serializeBinary();
  await Grpc.sendGrpcRequest("Feed/SnoopV1", headers, bytes, false);
  return;
};

/** challengeType: 1:偷偷看 3:一般 */
const ChallengeV2 = async (headers, feedId, challengeType) => {
  const request = new FeedChallengeV2Proto.FeedChallengeV2.Types.Request();
  request.setFeedType(FeedTypeProto.FeedType.FEED_TYPE_SOMEONE);
  request.setFeedId(feedId);
  request.setChallengeType(
    challengeType === 3
      ? FeedChallengeV2Proto.FeedChallengeV2.Types.Request.Types
          .FeedChallengeType.FEED_CHALLENGE_TYPE_IGNORE_PREVIOUS_RESULTS
      : FeedChallengeV2Proto.FeedChallengeV2.Types.Request.Types
          .FeedChallengeType.FEED_CHALLENGE_TYPE_SELECT_ONE_SNOOPED
  );

  const bytes = request.serializeBinary();
  await Grpc.sendGrpcRequest("Feed/ChallengeV2", headers, bytes, false);
  return;
};

const ShareV1 = async (headers, transactionId) => {
  const request = new FeedShareV1Proto.FeedShareV1.Types.Request();
  request.setTransactionId(transactionId);

  const bytes = request.serializeBinary();
  await Grpc.sendGrpcRequest("Feed/ShareV1", headers, bytes, false);
  return;
};

/** 找出 requireFeedStamina 總和是 4 或 5 的組合 */
const filterFeeds = (someoneFeeds) => {
  const targets = [4, 5];
  let found = null;

  function dfs(start, path, total) {
    if (targets.includes(total)) {
      found = [...path];
      return true; // 立即結束
    }
    if (total > Math.max(...targets)) return false;

    for (let i = start; i < someoneFeeds.length; i++) {
      if (
        dfs(
          i + 1,
          [...path, someoneFeeds[i]],
          total + someoneFeeds[i].challengeInfo.requireFeedStamina
        )
      ) {
        return true;
      }
    }
    return false;
  }

  dfs(0, [], 0);
  return found || [];
};

module.exports = {
  RenewTimelineV1,
  SnoopV1,
  ChallengeV2,
  ShareV1,

  filterFeeds,
};
