const PackClient = require("./PackClient.js");
const PackShopClient = require("./PackShopClient.js");

const openPack = async (headers, packId, productId, packPowerType) => {
  const detailResponse = await PackClient.GetDetailV2(headers, packId);
  const detailData = detailResponse.data;
  const packConsistentToken = detailData.packConsistentToken;

  const purchaseResponse = await PackShopClient.PurchaseV2(
    headers,
    packConsistentToken,
    productId,
    0,
    packPowerType
  );

  return {
    cardsList:
      purchaseResponse.data.unpackOrdersList[0].produces.cardInstancesList,
  };
};

module.exports = {
  openPack,
};
