import socketApiService from "../api.js";
import toastService from "../toast.js";
import { computePower } from "../units/computePower.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 事件戰鬥 Store
export const useEventBattleStore = defineStore("eventBattle", () => {
  const deckList = ref([]);
  const eventPower = ref(null);
  const startEventBattleResult = ref(null);
  const myDeckId = ref(null);

  const isGettingInfo = ref(false);
  const isBattleRunning = ref(false);

  const getInfo = async (account) => {
    isGettingInfo.value = true;
    await getDeckList(account);
    await getEventPowers(account);
    isGettingInfo.value = false;
  };

  const getDeckList = async (account) => {
    const response = await socketApiService.getDeckList(account.id);
    deckList.value = response.data;
  };

  const getEventPowers = async (account) => {
    const response = await socketApiService.getEventPowers(account.id);
    const { amount, nextAutoHealedAt } = computePower(response.data.eventPower);
    eventPower.value = {
      ...response.data,
      eventPower: {
        ...response.data.eventPower,
        amount,
        nextAutoHealedAt: new Date(nextAutoHealedAt * 1000).toLocaleString(),
      },
    };
  };

  const runBattle = async (account, battleId) => {
    if (myDeckId.value === null) {
      toastService.error("請選擇排組");
      return;
    }
    isBattleRunning.value = true;
    await startEventBattle(account, battleId);
    await finishEventBattle(
      account,
      battleId,
      startEventBattleResult.value.battleSessionToken
    );
    await getEventPowers(account);
    toastService.success("戰鬥需間隔 15 秒");
    setTimeout(() => {
      isBattleRunning.value = false;
    }, 15000);
  };

  const startEventBattle = async (account, battleId) => {
    isBattleRunning.value = true;
    const response = await socketApiService.startEventBattle(
      account.id,
      battleId,
      myDeckId.value
    );
    startEventBattleResult.value = response.data;
  };

  const finishEventBattle = async (account, battleId, token) => {
    await socketApiService.finishEventBattle(
      account.id,
      battleId,
      myDeckId.value,
      token
    );
  };

  const clearAll = () => {
    deckList.value = [];
    eventPower.value = null;
    startEventBattleResult.value = null;
    myDeckId.value = null;
  };

  return {
    deckList,
    eventPower,
    startEventBattleResult,
    myDeckId,
    isBattleRunning,

    getInfo,
    runBattle,
    clearAll,
  };
});
