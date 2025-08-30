import socketApiService from "../api.js";
import toastService from "../toast.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

export const useFriendStore = defineStore("friend", () => {
  const isLockFriendActions = ref(false);

  const getFriendList = async (account) => {
    isLockFriendActions.value = true;
    await socketApiService.getFriendList(account.id);
    isLockFriendActions.value = false;
  };

  const deleteFriend = async (account, playerId) => {
    isLockFriendActions.value = true;
    await socketApiService.deleteFriend(account.id, playerId);
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

  return {
    isLockFriendActions,

    getFriendList,
    deleteFriend,
    deleteAllFriends,
    cancelAllFriendRequest,
    rejectAllFriendRequest,
  };
});
