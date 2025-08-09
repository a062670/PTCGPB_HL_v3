const Grpc = require("../lib/Grpc.js");
const { createUuidV4 } = require("../lib/Units.js");

const PackShopPurchaseV2Proto = require("../generated/takasho/schema/lettuce_server/player_api/pack_shop_purchase_v2_pb.js");
const PackPowerHealItemsProto = require("../generated/takasho/schema/lettuce_server/resource/pack/pack_power_heal_items_pb.js");
const PackPowerToUseProto = require("../generated/takasho/schema/lettuce_server/resource/pack/pack_power_to_use_pb.js");
const PackPowerChargerProto = require("../generated/takasho/schema/lettuce_server/resource/item/pack_power_charger_pb.js");

const PurchaseV2 = async (
  headers,
  packConsistentToken,
  productId,
  chargersAmount,
  packPowerType = "PACK_POWER_NORMAL"
) => {
  const request =
    new PackShopPurchaseV2Proto.PackShopPurchaseV2.Types.Request();

  request.setPackConsistentToken(packConsistentToken);
  const transactionId = createUuidV4();
  request.setTransactionId(transactionId);
  request.setProductId(productId);
  request.setAmount(
    PackShopPurchaseV2Proto.PackShopPurchaseV2.Types.Request.Types.Amount
      .AMOUNT_ONE
  );

  const healItems = new PackPowerHealItemsProto.PackPowerHealItems();
  const chargers = new PackPowerChargerProto.PackPowerCharger();
  chargers.setType(
    PackPowerChargerProto.PackPowerCharger.Types.Type.TYPE_LARGE
  );
  chargers.setAmount(chargersAmount);
  healItems.setChargersList(chargersAmount ? [chargers] : []);
  healItems.setVcAmount(0);
  request.setHealItems(healItems);

  const usePowers = new PackPowerToUseProto.PackPowerToUse();
  usePowers.setPowerId(packPowerType);
  usePowers.setAmount(1);
  request.setUsePowersList([usePowers]);

  request.setDoShare(true);

  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "PackShop/PurchaseV2",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    PackShopPurchaseV2Proto.PackShopPurchaseV2.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  PurchaseV2,
};
