const Grpc = require("../lib/Grpc.js");

const DeckSaveV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/deck_save_v1_pb.js");
const DeckGetListV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/deck_get_list_v1_pb.js");

const DeckProto = require("../generated/takasho/schema/lettuce_server/resource/deck/deck_pb.js");
const DeckCaseTypeProto = require("../generated/takasho/schema/lettuce_server/resource/deck/deck_case_type_pb.js");
const DeckSlotProto = require("../generated/takasho/schema/lettuce_server/resource/deck/deck_slot_pb.js");
const EnergyTypeProto = require("../generated/takasho/schema/lettuce_server/resource/pokemon/energy_type_pb.js");

const CardInstanceProto = require("../generated/takasho/schema/lettuce_server/resource/card/card_instance_pb.js");
const DeckMainCardTypeProto = require("../generated/takasho/schema/lettuce_server/resource/deck/deck_main_card_type_pb.js");

const LanguageProto = require("../generated/takasho/schema/lettuce_server/resource/language/language_pb.js");
const { getCachedBytes } = require("../lib/Units.js");
// const CardSkinProto = require("../generated/takasho/schema/lettuce_server/resource/card_skin/card_skin_pb.js");

const DeckSaveV1 = async (headers) => {
  const bytes = getCachedBytes(["Deck/SaveV1"], () => {
    const request = new DeckSaveV1Proto.DeckSaveV1.Types.Request();

    const deck = new DeckProto.Deck();
    deck.setDeckId(1);
    deck.setDeckName("穿山王牌組");
    deck.setDeckShieldId("");
    deck.setCoinSkinId("COIN_100160_MONSTERBALL");
    deck.setPlayMatId("");
    deck.setDeckCaseType(
      DeckCaseTypeProto.DeckCaseType.DECK_CASE_TYPE_FIGHTING
    );
    deck.setEnergyTypesList([EnergyTypeProto.EnergyType.ENERGY_TYPE_FIGHTING]);
    const slots = [];
    const cards = [
      "PK_10_001370_00",
      "PK_10_001370_00",
      "PK_10_001510_00",
      "PK_10_001510_00",
      "PK_10_001550_00",
      "PK_10_001600_00",
      "PK_10_001600_00",
      "PK_10_001380_00",
      "PK_10_001500_00",
      "PK_10_001610_00",
      "PK_10_001860_00",
      "PK_10_001890_00",
      "PK_10_001890_00",
      "PK_10_001900_00",
      "PK_10_001930_00",
      "PK_10_001980_00",
      "TR_90_000030_00",
      "TR_90_000030_00",
      "TR_90_000040_00",
      "TR_90_000040_00",
    ];
    for (const i in cards) {
      const cardId = cards[i];
      const slot = new DeckSlotProto.DeckSlot();
      slot.setSlotNumber(i + 1);
      if (cardId === "PK_10_001380_00") {
        slot.setMainCardType(
          DeckMainCardTypeProto.DeckMainCardType.DECK_MAIN_CARD_TYPE_MAIN
        );
      }
      const cardInstance = new CardInstanceProto.CardInstance();
      cardInstance.setCardId(cardId);
      cardInstance.setLang(LanguageProto.Language.LANGUAGE_CN);
      cardInstance.setExpansionId("L1");
      // cardInstance.setCardSkin();
      slot.setCardInstance(cardInstance);
      slots.push(slot);
    }
    deck.setSlotsList(slots);

    request.setDeck(deck);

    const bytes = request.serializeBinary();
    return bytes;
  });
  await Grpc.sendGrpcRequest("Deck/SaveV1", headers, bytes, false);

  return;
};

const GetListV1 = async (headers) => {
  const request = new DeckGetListV1Proto.DeckGetListV1.Types.Request();
  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest("Deck/GetListV1", headers, bytes);
  const resultBody =
    DeckGetListV1Proto.DeckGetListV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();
  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  DeckSaveV1,
  GetListV1,
};
