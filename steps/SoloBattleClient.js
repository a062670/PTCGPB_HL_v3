const Grpc = require("../lib/Grpc.js");

const SoloBattleStartStepupBattleProto = require("../generated/takasho/schema/lettuce_server/player_api/solo_battle_start_stepup_battle_v1_pb.js");
const SoloBattleFinishStepupBattleProto = require("../generated/takasho/schema/lettuce_server/player_api/solo_battle_finish_stepup_battle_v1_pb.js");

const SoloBattleDeckProto = require("../generated/takasho/schema/lettuce_server/resource/solo_battle/solo_battle_deck_pb.js");
const SoloBattleResultTypeProto = require("../generated/takasho/schema/lettuce_server/resource/solo_battle/solo_battle_result_type_pb.js");
const SoloBattleTryProgressProto = require("../generated/takasho/schema/lettuce_server/resource/solo_battle/solo_battle_try_progress_pb.js");
const SoloBattleInGameStatisticsProto = require("../generated/takasho/schema/lettuce_server/resource/solo_battle/solo_battle_in_game_statistics_pb.js");
const SoloBattleGetEventPowersV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/solo_battle_get_event_powers_v1_pb.js");
const SoloBattleStartEventBattleV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/solo_battle_start_event_battle_v1_pb.js");
const SoloBattleFinishEventBattleV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/solo_battle_finish_event_battle_v1_pb.js");

const { getCachedBytes } = require("../lib/Units.js");
// const checkCooldown = require("../lib/cooldown.js");
// let lastTimeFinishStepupBattleV1 = null;

const StartStepupBattleV1 = async (headers, soloStepupBattleId) => {
  const bytes = getCachedBytes(
    ["SoloBattle/StartStepupBattleV1", soloStepupBattleId],
    () => {
      const request =
        new SoloBattleStartStepupBattleProto.SoloBattleStartStepupBattleV1.Types.Request();

      const deck = new SoloBattleDeckProto.SoloBattleDeck();
      deck.setType(
        SoloBattleDeckProto.SoloBattleDeck.Types.DeckType.DECK_TYPE_MY_DECK
      );
      deck.setRentalDeckId("");
      deck.setMyDeckId(1);

      request.setSoloStepupBattleId(soloStepupBattleId);
      request.setDeck(deck);

      const bytes = request.serializeBinary();
      return bytes;
    }
  );
  const result = await Grpc.sendGrpcRequest(
    "SoloBattle/StartStepupBattleV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    SoloBattleStartStepupBattleProto.SoloBattleStartStepupBattleV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

const FinishStepupBattleV1 = async (
  headers,
  soloStepupBattleId,
  soloStepupBattleToken
) => {
  // lastTimeFinishStepupBattleV1 = await checkCooldown(
  //   lastTimeFinishStepupBattleV1,
  //   1 * 1000
  // );

  const request =
    new SoloBattleFinishStepupBattleProto.SoloBattleFinishStepupBattleV1.Types.Request();

  /**
      repeated takasho.schema.lettuce_server.resource.solo_battle.SoloBattleTryProgress battle_try_progresses = 3;
      takasho.schema.lettuce_server.resource.solo_battle.SoloBattleInGameStatistics battle_stats = 6;

 */
  request.setBattleId(soloStepupBattleId);
  request.setBattleSessionToken(soloStepupBattleToken);
  request.setResultType(
    SoloBattleResultTypeProto.SoloBattleResultType
      .SOLO_BATTLE_RESULT_TYPE_RESULT_TYPE_WIN
  );
  const deck = new SoloBattleDeckProto.SoloBattleDeck();
  deck.setType(
    SoloBattleDeckProto.SoloBattleDeck.Types.DeckType.DECK_TYPE_MY_DECK
  );
  deck.setRentalDeckId("");
  deck.setMyDeckId(1);
  request.setDeck(deck);

  const battleTryProgress =
    new SoloBattleTryProgressProto.SoloBattleTryProgress();
  battleTryProgress.setBattleTryId(`BT_TR_${soloStepupBattleId}_02`);
  battleTryProgress.setCurrentCount(4);
  request.setBattleTryProgressesList([battleTryProgress]);

  const battleStats =
    new SoloBattleInGameStatisticsProto.SoloBattleInGameStatistics();
  // battleStats.setIsConcede(false);
  battleStats.setTurnNum(15);
  battleStats.setPre(true);
  battleStats.setPlayerPoint(3);
  // battleStats.setTargetPlayerPoint(10);
  battleStats.setAutoFlg(true);
  request.setBattleStats(battleStats);

  const bytes = request.serializeBinary();

  await Grpc.sendGrpcRequest(
    "SoloBattle/FinishStepupBattleV1",
    headers,
    bytes,
    false
  );

  return;
};

const GetEventPowersV1 = async (headers, eventIds) => {
  const request =
    new SoloBattleGetEventPowersV1Proto.SoloBattleGetEventPowersV1.Types.Request();
  request.setEventIdsList(eventIds);
  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "SoloBattle/GetEventPowersV1",
    headers,
    bytes
  );
  const resultBody =
    SoloBattleGetEventPowersV1Proto.SoloBattleGetEventPowersV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();
  return {
    data: body,
    headers: result.headers,
  };
};

const StartEventBattleV1 = async (headers, battleId, myDeckId) => {
  const request =
    new SoloBattleStartEventBattleV1Proto.SoloBattleStartEventBattleV1.Types.Request();
  request.setSoloEventBattleId(battleId);

  const deck = new SoloBattleDeckProto.SoloBattleDeck();
  deck.setType(
    SoloBattleDeckProto.SoloBattleDeck.Types.DeckType.DECK_TYPE_MY_DECK
  );
  deck.setMyDeckId(myDeckId);
  request.setDeck(deck);

  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "SoloBattle/StartEventBattleV1",
    headers,
    bytes
  );
  const resultBody =
    SoloBattleStartEventBattleV1Proto.SoloBattleStartEventBattleV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();
  return {
    data: body,
    headers: result.headers,
  };
};

const FinishEventBattleV1 = async (headers, battleId, myDeckId, token) => {
  const request =
    new SoloBattleFinishEventBattleV1Proto.SoloBattleFinishEventBattleV1.Types.Request();
  request.setBattleId(battleId);
  request.setBattleSessionToken(token);
  request.setResultType(
    SoloBattleResultTypeProto.SoloBattleResultType
      .SOLO_BATTLE_RESULT_TYPE_RESULT_TYPE_WIN
  );
  const deck = new SoloBattleDeckProto.SoloBattleDeck();
  deck.setType(
    SoloBattleDeckProto.SoloBattleDeck.Types.DeckType.DECK_TYPE_MY_DECK
  );
  deck.setMyDeckId(myDeckId);
  request.setDeck(deck);

  const battleTryProgressesList = [];

  if (battleId.startsWith("BT_GR")) {
    const currentCountSettingList = [
      [],
      [1, 3],
      [2, 1, 1],
      [2, 1, 1, 1],
      [1, 1, 1, 10, 20],
    ];
    const idx = Number(battleId.split("_").pop());
    const currentCountSetting = currentCountSettingList[idx];
    if (currentCountSetting) {
      for (let i = 1; i <= currentCountSetting.length; i++) {
        const battleTryProgress =
          new SoloBattleTryProgressProto.SoloBattleTryProgress();
        battleTryProgress.setBattleTryId(`BT_TR_${battleId}_0${i}`);
        battleTryProgress.setCurrentCount(currentCountSetting[i - 1]);
        battleTryProgressesList.push(battleTryProgress);
      }
    }
  }
  request.setBattleTryProgressesList(battleTryProgressesList);

  const battleStats =
    new SoloBattleInGameStatisticsProto.SoloBattleInGameStatistics();
  // battleStats.setIsConcede(false);
  battleStats.setTurnNum(12);
  battleStats.setPre(true);
  battleStats.setPlayerPoint(3);
  battleStats.setTargetPlayerPoint(0);
  battleStats.setAutoFlg(true);
  request.setBattleStats(battleStats);

  const bytes = request.serializeBinary();
  await Grpc.sendGrpcRequest(
    "SoloBattle/FinishEventBattleV1",
    headers,
    bytes,
    false
  );

  return;
};
module.exports = {
  StartStepupBattleV1,
  FinishStepupBattleV1,
  GetEventPowersV1,
  StartEventBattleV1,
  FinishEventBattleV1,
};
