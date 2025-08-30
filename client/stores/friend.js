import { CardsOneStar } from "../data/CardsOneStar.js";
import { CardsTwoStar } from "../data/CardsTwoStar.js";

import socketApiService from "../api.js";
import toastService from "../toast.js";
import { useAppStore } from "./app.js";

const { ref, reactive, computed, watch } = Vue;
const { defineStore } = Pinia;

export const useFriendStore = defineStore("friend", () => {
  const appStore = useAppStore();

  /** 篩選條件 */
  const filters = reactive({
    countOfStar: 4,
    countOfNew: 2,
  });

  const isLockFriendActions = ref(false);

  const init = () => {
    const localFilters =
      JSON.parse(localStorage.getItem("friendFilters")) || {};
    filters.countOfStar = isNaN(localFilters.countOfStar)
      ? 4
      : localFilters.countOfStar;
    filters.countOfNew = isNaN(localFilters.countOfNew)
      ? 2
      : localFilters.countOfNew;
    watch(filters, () => {
      console.log("filters", filters);
      localStorage.setItem("friendFilters", JSON.stringify(filters));
    });
  };

  const getFriendList = async (account) => {
    isLockFriendActions.value = true;
    await socketApiService.getFriendList(account.id);
    isLockFriendActions.value = false;
  };

  const deleteFriend = async (account, playerIds) => {
    isLockFriendActions.value = true;
    await socketApiService.deleteFriend(account.id, playerIds);
    isLockFriendActions.value = false;
  };

  const deleteAllFriends = async (account) => {
    isLockFriendActions.value = true;
    await socketApiService.cancelAllFriendRequest(account.id);
    await socketApiService.getFriendList(account.id);
    isLockFriendActions.value = false;
  };

  const cancelAllFriendRequest = async (account) => {
    isLockFriendActions.value = true;
    await socketApiService.cancelAllFriendRequest(account.id);
    await socketApiService.getFriendList(account.id);
    isLockFriendActions.value = false;
  };

  const rejectAllFriendRequest = async (account) => {
    isLockFriendActions.value = true;
    await socketApiService.rejectAllFriendRequest(account.id);
    await socketApiService.getFriendList(account.id);
    isLockFriendActions.value = false;
  };

  const clearFriendList = async (account) => {
    isLockFriendActions.value = true;
    if (!account.playerResources.cardStocks.length) {
      await appStore.getPlayerResources(account);
    }
    const friendList = await socketApiService.getFriendList(account.id);
    const playerIds = [];
    for (const friend of friendList.data.data.friendsList) {
      const cards = appStore.findGodPack(friend.playerId);
      let countOfStar = 0;
      let countOfNew = 0;
      for (const card of cards) {
        if (CardsOneStar.includes(card.cardId)) {
          countOfStar += 1;
        } else if (CardsTwoStar.includes(card.cardId)) {
          countOfStar += 2;
        }
        if (
          !account.playerResources.cardStocks.some(
            (stock) => stock === card.cardId
          )
        ) {
          countOfNew += 1;
        }
      }
      if (
        countOfStar < filters.countOfStar &&
        countOfNew < filters.countOfNew
      ) {
        playerIds.push(friend.playerId);
      }
    }
    if (playerIds.length > 0) {
      await socketApiService.deleteFriend(account.id, playerIds);
    }
    isLockFriendActions.value = false;
  };

  return {
    filters,
    isLockFriendActions,

    init,
    getFriendList,
    deleteFriend,
    deleteAllFriends,
    cancelAllFriendRequest,
    rejectAllFriendRequest,
    clearFriendList,
  };
});
