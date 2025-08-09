const Grpc = require("../lib/Grpc.js");
const { createUuidV4, getCachedBytes } = require("../lib/Units.js");
const ItemShopPurchaseProto = require("../generated/takasho/schema/lettuce_server/player_api/item_shop_purchase_v1_pb.js");
const CurrencyProto = require("../generated/takasho/schema/lettuce_server/resource/item/currency_pb.js");
const ItemShopGetPurchaseSummariesV1Proto = require("../generated/takasho/schema/lettuce_server/player_api/item_shop_get_purchase_summaries_v1_pb.js");
const ProductTypeProto = require("../generated/takasho/schema/lettuce_server/resource/item_shop/product_type_pb.js");
const PokeGoldProto = require("../generated/takasho/schema/lettuce_server/resource/item/poke_gold_pb.js");

const transactionId = createUuidV4(); // 用固定transactionId可以過 速度比較快

const PurchaseV1 = async (headers, productId, ticketAmount, times = 1) => {
  const bytes = getCachedBytes(
    ["ItemShop/PurchaseV1", productId, ticketAmount, times],
    () => {
      const request =
        new ItemShopPurchaseProto.ItemShopPurchaseV1.Types.Request();
      request.setShopId("SHOP");
      request.setProductId(productId);
      request.setTransactionId(transactionId);
      request.setAmount(times);

      if (ticketAmount) {
        const currency = new CurrencyProto.Currency();
        currency.setType(CurrencyProto.Currency.Types.Type.TYPE_SHOP_TICKET);
        currency.setAmount(times * ticketAmount);
        request.setCurrenciesList([currency]);
      } else {
        request.setCurrenciesList([]);
      }

      const pokeGold = new PokeGoldProto.PokeGold();
      // pokeGold.setPaid(false);
      pokeGold.setAmount(0);

      request.setPokeGoldsList([pokeGold]);

      const bytes = request.serializeBinary();
      return bytes;
    }
  );

  await Grpc.sendGrpcRequest("ItemShop/PurchaseV1", headers, bytes, false);
  return;
};

const GetPurchaseSummariesV1 = async (headers, productId) => {
  const request =
    new ItemShopGetPurchaseSummariesV1Proto.ItemShopGetPurchaseSummariesV1.Types.Request();
  request.setShopId("SHOP");

  const product =
    new ItemShopGetPurchaseSummariesV1Proto.ItemShopGetPurchaseSummariesV1.Types.Request.Types.Product();
  product.setProductId(productId);
  // 先只吃 currency
  product.setProductType(ProductTypeProto.ProductType.PRODUCT_TYPE_CURRENCY);

  request.setProductIdsList([product]);
  const bytes = request.serializeBinary();
  const result = await Grpc.sendGrpcRequest(
    "ItemShop/GetPurchaseSummariesV1",
    headers,
    bytes
  );
  const resultBody =
    ItemShopGetPurchaseSummariesV1Proto.ItemShopGetPurchaseSummariesV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();
  return {
    data: body,
    headers: result.headers,
  };
};

module.exports = {
  PurchaseV1,
  GetPurchaseSummariesV1,
};
