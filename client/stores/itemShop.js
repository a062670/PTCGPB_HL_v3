import socketApiService from "../api.js";
import toastService from "../toast.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 商店 Store
export const useItemShopStore = defineStore("itemShop", () => {
  const isRunning = ref(false);

  const runPurchase = async (account) => {
    isRunning.value = true;
    const response = await socketApiService.getItemShopPurchaseSummaries(
      account.id,
      "SH_CG_SH_001_001"
    );
    const find = response.data.purchaseSummariesList.find(
      (item) => item.productId === "SH_CG_SH_001_001"
    );
    if (!find) {
      toastService.error("每日禮物查詢失敗！");
      isRunning.value = false;
      return;
    }
    if (find.purchaseAmount > 0) {
      toastService.error("每日禮物已領取！");
      isRunning.value = false;
      return;
    }
    await socketApiService.purchaseItemShop(
      account.id,
      "SH_CG_SH_001_001",
      0,
      1
    );
    toastService.success("每日禮物領取成功！");
    isRunning.value = false;
  };

  return {
    isRunning,
    runPurchase,
  };
});
