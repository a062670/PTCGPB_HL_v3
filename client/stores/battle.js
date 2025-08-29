import socketApiService from "../api.js";
import toastService from "../toast.js";
import { computePower } from "../units/computePower.js";
import { sleep } from "../units/sleep.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 戰鬥 Store
export const useBattleStore = defineStore("battle", () => {
  // 播放器
  const soundBattle = ref(false);
  const soundBattleFinish = ref(false);
  // 音量
  const soundVolume = ref(0);

  const deckList = ref([]);
  const eventPower = ref(null);
  const battleIds = ref([]);
  const startEventBattleResult = ref(null);
  const startStepupBattleResult = ref(null);
  const myDeckId = ref(null);
  const pack = ref(null);
  const difficulty = ref(null);
  const lastBattleId = ref(null);

  const isGettingInfo = ref(false);
  const isBattleRunning = ref(false);

  const packOptions = computed(() => {
    const packs = battleIds.value.map((item) => item.pack);
    return [...new Set(packs)];
  });

  const difficultyOptions = computed(() => {
    const difficulties = battleIds.value.map((item) => item.difficulty);
    return [...new Set(difficulties)];
  });

  const battleIdsFiltered = computed(() => {
    if (!pack.value || !difficulty.value) return [];
    return (
      battleIds.value.find(
        (item) =>
          item.pack === pack.value && item.difficulty === difficulty.value
      )?.ids || []
    );
  });

  const init = () => {
    soundBattle.value = new Audio("/assets/sounds/28.mp3");
    soundBattleFinish.value = new Audio("/assets/sounds/29.mp3");
    const volume = parseFloat(localStorage.getItem("soundVolume")) || 0;
    soundVolume.value = Math.min(Math.max(volume, 0), 1);
    soundBattle.value.volume = soundVolume.value;
    soundBattleFinish.value.volume = soundVolume.value;
  };

  /** 設定音量 */
  const setVolume = (volume) => {
    soundVolume.value = volume;
    soundBattle.value.volume = volume;
    soundBattleFinish.value.volume = volume;
    localStorage.setItem("soundVolume", volume);
  };

  /** 停止播放 */
  const stopSound = () => {
    soundBattle.value.pause();
    soundBattleFinish.value.pause();
  };

  const getInfo = async (account) => {
    isGettingInfo.value = true;
    await getDeckList(account);
    await getEventPowers(account);
    await getBattleIds(account);
    isGettingInfo.value = false;
  };

  const getBattleIds = async (account) => {
    if (!battleIds.value.length) {
      const response = await socketApiService.getBattleIds(account.id);
      battleIds.value = response.data;
    }
  };

  const getDeckList = async (account) => {
    const response = await socketApiService.getDeckList(account.id);
    deckList.value = response.data;
    if (
      !myDeckId.value ||
      !deckList.value.some((item) => item.deckId === myDeckId.value)
    ) {
      myDeckId.value = deckList.value[0]?.deckId || null;
    }
  };

  const getEventPowers = async (account) => {
    const response = await socketApiService.getEventPowers(account.id);
    if (!response.data.eventPower) {
      eventPower.value = null;
      return;
    }
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

  const runEventBattle = async (account, battleId) => {
    if (myDeckId.value === null) {
      toastService.error("請選擇排組");
      return;
    }
    isBattleRunning.value = true;

    soundBattleFinish.value.pause();
    soundBattle.value.currentTime = 0;
    soundBattle.value.play();

    await startEventBattle(account, battleId);
    await finishEventBattle(
      account,
      battleId,
      startEventBattleResult.value.battleSessionToken
    );
    await getEventPowers(account);

    soundBattle.value.pause();
    soundBattleFinish.value.currentTime = 0;
    soundBattleFinish.value.play();

    toastService.success("戰鬥勝利");
    isBattleRunning.value = false;
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

  const runStepupBattle = async (account, battleId) => {
    if (myDeckId.value === null) {
      toastService.error("請選擇排組");
      return;
    }
    isBattleRunning.value = true;

    lastBattleId.value = battleId;

    soundBattleFinish.value.pause();
    soundBattle.value.currentTime = 0;
    soundBattle.value.play();

    await startStepupBattle(account, battleId);
    await sleep(41000);
    await finishStepupBattle(
      account,
      battleId,
      startStepupBattleResult.value.battleSessionToken
    );
    soundBattle.value.pause();
    soundBattleFinish.value.currentTime = 0;
    soundBattleFinish.value.play();
    toastService.success("戰鬥勝利");

    isBattleRunning.value = false;
  };

  const startStepupBattle = async (account, battleId) => {
    isBattleRunning.value = true;
    const response = await socketApiService.startStepupBattle(
      account.id,
      battleId,
      myDeckId.value
    );
    startStepupBattleResult.value = response.data;
  };

  const finishStepupBattle = async (account, battleId, token) => {
    await socketApiService.finishStepupBattle(
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
    soundBattle,
    soundBattleFinish,
    soundVolume,

    deckList,
    eventPower,
    battleIds,
    startEventBattleResult,
    myDeckId,
    pack,
    difficulty,
    lastBattleId,
    isBattleRunning,

    // 計算屬性
    packOptions,
    difficultyOptions,
    battleIdsFiltered,

    init,
    setVolume,
    stopSound,
    getInfo,
    runEventBattle,
    runStepupBattle,
    clearAll,
  };
});
