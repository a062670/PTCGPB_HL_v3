const PackClient = require("./PackClient.js");
const PackShopClient = require("./PackShopClient.js");

const openPack = async (setting, packId, productId, language) => {
  const detailResponse = await PackClient.GetDetailV2(setting.headers, packId);
  const detailData = detailResponse.data;
  const packConsistentToken = detailData.packConsistentToken;

  let chargersAmount = 0;
  if (!setting.lastAutoHealedAt) {
    // -12 小時
    setting.lastAutoHealedAt = Date.now() - 12 * 60 * 60 * 1000;
  } else {
    // 相差的小時數
    const diff = Math.floor(
      (Date.now() - setting.lastAutoHealedAt) / (1000 * 60 * 60)
    );
    chargersAmount = 12 - diff;
    // setting.lastAutoHealedAt 加上 diff 小時
    setting.lastAutoHealedAt = setting.lastAutoHealedAt + diff * 60 * 60 * 1000;
  }

  const purchaseResponse = await PackShopClient.PurchaseV2(
    setting.headers,
    packConsistentToken,
    productId,
    chargersAmount
  );

  const transactionId = purchaseResponse.data.purchaseOrder.transactionId;
  const cardIds =
    purchaseResponse.data.unpackOrdersList[0].produces.cardInstancesList.map(
      (card) => card.cardInstance.cardId
    );

  return {
    transactionId,
    cardIds,
  };
};

module.exports = {
  openPack,
};
