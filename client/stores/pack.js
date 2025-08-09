import socketApiService from "../api.js";
import toastService from "../toast.js";
import { computePower } from "../units/computePower.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 開包 Store
export const usePackStore = defineStore("pack", () => {
  const packPower = ref(null);
  const openPackResult = ref(null);

  const isGettingPackPower = ref(false);
  const isOpeningPack = ref(false);

  const getPackPower = async (account) => {
    isGettingPackPower.value = true;
    const response = await socketApiService.getPackPower(account.id);
    response.data.packPower.packPowersList.forEach((item) => {
      const { amount, nextAutoHealedAt } = computePower(item);
      item.amount = amount;
      item.nextAutoHealedAt = new Date(
        nextAutoHealedAt * 1000
      ).toLocaleString();
    });
    response.data.packPower.amount =
      response.data.packPower.packPowersList.reduce(
        (acc, item) => acc + item.amount,
        0
      );
    packPower.value = response.data;
    isGettingPackPower.value = false;
  };

  const openPack = async (account, packId, productId) => {
    const packPowerType = packPower.value.packPower.packPowersList.find(
      (item) => item.amount > 0
    )?.packPowerId;
    if (!packPowerType) {
      toastService.error("沒有開包力！");
      return;
    }
    isOpeningPack.value = true;
    const response = await socketApiService.openPack(
      account.id,
      packId,
      productId,
      packPowerType
    );
    openPackResult.value = response.data;
    isOpeningPack.value = false;
    getPackPower(account);
  };

  const clearAll = () => {
    packPower.value = null;
    openPackResult.value = null;
  };

  const clearOpenPackResult = () => {
    openPackResult.value = null;
  };

  return {
    packPower,
    openPackResult,
    isGettingPackPower,
    isOpeningPack,

    getPackPower,
    openPack,
    clearAll,
    clearOpenPackResult,
  };
});
