import socketApiService from "../api.js";
import toastService from "../toast.js";
import { computePower } from "../units/computePower.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 得卡 Store
export const useFeedStore = defineStore("feed", () => {
  // 得卡列表
  const feedList = ref([]);
  const renewAfter = ref("");
  const challengePower = ref(null);

  const feedSnoopResult = ref(null);
  const feedChallengeResult = ref(null);

  const isHealingChallengePower = ref(false);
  const isFeedSnooping = ref(false);
  const isFeedChallenging = ref(false);

  const getFeedList = async (account) => {
    account.isGettingFeedList = true;
    const result = await socketApiService.getFeedList(account.id);
    feedList.value = result.data.list;
    renewAfter.value = new Date(result.data.renewAfter * 1000).toLocaleString();
    feedList.value.sort(
      (a, b) =>
        b.challengeInfo.requireFeedStamina - a.challengeInfo.requireFeedStamina
    );
    feedList.value.sort((a, b) => {
      if (a.isFriend && !b.isFriend) return -1;
      if (!a.isFriend && b.isFriend) return 1;
      return 0;
    });
    const { amount, nextAutoHealedAt } = computePower(
      result.data.challengePower
    );
    const needCountOfCharger = Math.ceil(
      (nextAutoHealedAt * 1000 - Date.now()) / (1000 * 60 * 60)
    );
    const needCountOfVc = Math.ceil(
      (nextAutoHealedAt * 1000 - Date.now()) / (1000 * 60 * 60 * 2)
    );
    challengePower.value = {
      ...result.data.challengePower,
      amount,
      nextAutoHealedAt: new Date(nextAutoHealedAt * 1000).toLocaleString(),
      needCountOfCharger,
      needCountOfVc,
    };
    account.isGettingFeedList = false;
  };

  const healChallengePower = async (account, chargerAmount, vcAmount) => {
    isHealingChallengePower.value = true;
    await socketApiService.healChallengePower(
      account.id,
      1,
      chargerAmount,
      vcAmount
    );
    isHealingChallengePower.value = false;
    getFeedList(account);
  };

  const feedSnoop = async (account, feedId, usedForRevivalChallengePower) => {
    isFeedSnooping.value = true;
    const result = await socketApiService.feedSnoop(
      account.id,
      feedId,
      usedForRevivalChallengePower
    );
    feedSnoopResult.value = result.data;
    isFeedSnooping.value = false;

    // 沒有偷偷看
    if (
      !feedSnoopResult.value.contents.cardsList.some((card) => card.isSnooped)
    ) {
      feedChallenge(account, feedId, 3, usedForRevivalChallengePower ? 1 : 3);
    }
  };

  const feedChallenge = async (account, feedId, challengeType, feedType) => {
    isFeedChallenging.value = true;
    const result = await socketApiService.feedChallenge(
      account.id,
      feedId,
      challengeType,
      feedType
    );
    feedChallengeResult.value = result.data;
    isFeedChallenging.value = false;
  };

  const clearAll = () => {
    feedList.value = {};
    renewAfter.value = "";
    challengePower.value = null;
    feedSnoopResult.value = null;
    feedChallengeResult.value = null;
  };

  const clearFeedSnoopResult = () => {
    feedSnoopResult.value = null;
    feedChallengeResult.value = null;
  };

  return {
    // 狀態
    feedList,
    renewAfter,
    challengePower,
    feedSnoopResult,
    feedChallengeResult,
    isHealingChallengePower,
    isFeedSnooping,
    isFeedChallenging,

    // Actions
    getFeedList,
    healChallengePower,
    feedSnoop,
    feedChallenge,
    clearAll,
    clearFeedSnoopResult,
  };
});
