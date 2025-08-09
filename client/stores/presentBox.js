import socketApiService from "../api.js";
import toastService from "../toast.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 禮物盒 Store
export const usePresentBoxStore = defineStore("presentBox", () => {
  // 禮物列表
  const presentBoxList = ref([]);

  // 領取禮物結果
  const receivePresentBoxResult = ref({});

  // 是否正在領取禮物
  const isReceivingPresentBox = ref(false);

  // 可批次領取的禮物列表
  const canBatchReceivePresentBoxList = computed(() => {
    return presentBoxList.value
      .filter((present) => present.currency?.type === 3)
      .map((present) => present.presentId);
  });

  // 取得禮物盒
  const getPresentBoxList = async (account) => {
    account.isGettingPresentBoxList = true;
    const result = await socketApiService.getPresentBoxList(account.id);
    presentBoxList.value = result.data.presentsList.map((present) => ({
      ...present,
      expiredAt: new Date(present.expiredAt.seconds * 1000).toLocaleString(),
    }));
    account.isGettingPresentBoxList = false;
  };

  // 領取禮物
  const receivePresentBox = async (account, presentBoxIds = null) => {
    isReceivingPresentBox.value = true;
    const presentBoxIdsToReceive =
      presentBoxIds || canBatchReceivePresentBoxList.value;
    if (presentBoxIdsToReceive.length <= 0) {
      return;
    }
    const result = await socketApiService.receivePresentBox(
      account.id,
      presentBoxIdsToReceive
    );
    receivePresentBoxResult.value = result.data;
    isReceivingPresentBox.value = false;
    toastService.success("領取禮物成功");
    getPresentBoxList(account);
  };

  // 清除所有
  const clearAll = () => {
    clearPresentBoxList();
    clearReceivePresentBoxResult();
  };

  // 清除禮物列表
  const clearPresentBoxList = () => {
    presentBoxList.value = [];
  };

  // 清除領取禮物結果列表
  const clearReceivePresentBoxResult = () => {
    receivePresentBoxResult.value = {};
  };

  return {
    // 狀態
    presentBoxList,
    receivePresentBoxResult,
    isReceivingPresentBox,

    // 計算屬性
    canBatchReceivePresentBoxList,

    // Actions
    getPresentBoxList,
    receivePresentBox,
    clearAll,
    clearPresentBoxList,
    clearReceivePresentBoxResult,
  };
});
