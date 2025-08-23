import socketApiService from "../api.js";
import toastService from "../toast.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 應用程式主要 Store
export const useAppStore = defineStore("app", () => {
  // 狀態
  const title = ref("PTCGPB_HL_v3");
  const drawer = ref(true);
  const loading = ref(false);
  const version = ref("");
  const lastVersion = ref("");

  // 帳號相關狀態
  const accounts = ref([]);
  const selectedAccountId = ref(null);

  // 資料相關
  const showType = ref("");

  const isLoggingIn = ref(false);
  const isApproving = ref(false);
  const isSendFriendRequest = ref(false);
  const isFreeFeeding = ref(false);
  const isGettingPlayerResources = ref(false);
  const isGettingFriendList = ref(false);
  const isDeletingFriends = ref(false);
  const isCancellingFriendRequest = ref(false);
  const isRejectingFriendRequest = ref(false);

  // 計算屬性
  const selectedAccount = computed(() => {
    return (
      accounts.value.find(
        (account) => account.id === selectedAccountId.value
      ) || null
    );
  });

  // 設置通知監聽器
  const setupNotificationListeners = () => {
    // 監聽帳號更新通知
    socketApiService.on("updateAccount", (updatedAccount) => {
      console.log("收到帳號更新通知:", updatedAccount);

      // 找到對應的帳號並更新
      const accountIndex = accounts.value.findIndex(
        (acc) => acc.id === updatedAccount.id
      );
      if (accountIndex !== -1) {
        // 更新帳號資料
        updateAccount(accounts.value[accountIndex], updatedAccount);
      }
    });
    // 監聽版本更新通知
    socketApiService.on("updateLastVersion", (version) => {
      console.log("收到版本更新通知:", version);
      lastVersion.value = version;
    });
  };

  // 移除 hideSnackbar，toast 會自動關閉

  const toggleDrawer = () => {
    drawer.value = !drawer.value;
  };

  const setLoading = (status) => {
    loading.value = status;
  };

  // Socket API 相關 Actions
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const versionResult = await socketApiService.getVersion();
      version.value = versionResult.data;

      const result = await socketApiService.getAccounts();
      const accountsData = result.data?.accounts || [];
      accounts.value = accountsData.map((account) => ({
        ...account,
        playerResources: {
          cardStocks: [],
          packPowerChargers: [],
          challengePowerChargers: [],
        },
        lastUpdateAt: new Date().toLocaleString(),
      }));

      // 設置通知監聽器
      setupNotificationListeners();

      // 檢查新版本
      await socketApiService.checkVersion();

      toastService.success("帳號列表載入成功");
    } catch (error) {
      console.error("Socket API 錯誤:", error);
      toastService.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (account) => {
    isLoggingIn.value = true;
    const result = await socketApiService.login(account.id);
    updateAccount(account, result.data);
    isLoggingIn.value = false;
  };

  const logout = async (account) => {
    isLoggingIn.value = true;
    const result = await socketApiService.logout(account.id);
    updateAccount(account, result.data);
    isLoggingIn.value = false;
  };

  const getPlayerResources = async (account) => {
    isGettingPlayerResources.value = true;
    const result = await socketApiService.getPlayerResources(account.id);
    account.playerResources = result.data;
    isGettingPlayerResources.value = false;
  };

  const approve = async (account) => {
    isApproving.value = true;
    const result = await socketApiService.approve(account.id);
    updateAccount(account, result.data);
    isApproving.value = false;
  };

  const stopApprove = async (account) => {
    isApproving.value = true;
    const result = await socketApiService.stopApprove(account.id);
    updateAccount(account, result.data);
    isApproving.value = false;
  };

  const startSendFriendRequest = async (account) => {
    isSendFriendRequest.value = true;
    const result = await socketApiService.startSendFriendRequest(account.id);
    updateAccount(account, result.data);
    isSendFriendRequest.value = false;
  };

  const stopSendFriendRequest = async (account) => {
    isSendFriendRequest.value = true;
    const result = await socketApiService.stopSendFriendRequest(account.id);
    updateAccount(account, result.data);
    isSendFriendRequest.value = false;
  };

  const startFreeFeed = async (account) => {
    isFreeFeeding.value = true;
    const result = await socketApiService.startFreeFeed(account.id);
    updateAccount(account, result.data);
    isFreeFeeding.value = false;
  };

  const stopFreeFeed = async (account) => {
    isFreeFeeding.value = true;
    const result = await socketApiService.stopFreeFeed(account.id);
    updateAccount(account, result.data);
    isFreeFeeding.value = false;
  };

  const getFriendList = async (account) => {
    isGettingFriendList.value = true;
    await socketApiService.getFriendList(account.id);
    isGettingFriendList.value = false;
  };

  const deleteFriend = async (account, playerId) => {
    isDeletingFriends.value = true;
    await socketApiService.deleteFriend(account.id, playerId);
    isDeletingFriends.value = false;
  };

  const deleteAllFriends = async (account) => {
    isDeletingFriends.value = true;
    const result = await socketApiService.deleteAllFriends(account.id);
    updateAccount(account, result.data);
    await socketApiService.getFriendList(account.id);
    isDeletingFriends.value = false;
  };

  const cancelAllFriendRequest = async (account) => {
    isCancellingFriendRequest.value = true;
    const result = await socketApiService.cancelAllFriendRequest(account.id);
    updateAccount(account, result.data);
    await socketApiService.getFriendList(account.id);
    isCancellingFriendRequest.value = false;
  };

  const rejectAllFriendRequest = async (account) => {
    isRejectingFriendRequest.value = true;
    const result = await socketApiService.rejectAllFriendRequest(account.id);
    updateAccount(account, result.data);
    await socketApiService.getFriendList(account.id);
    isRejectingFriendRequest.value = false;
  };

  const selectAccount = (account) => {
    selectedAccountId.value = account.id;
  };

  const clearSelectedAccount = () => {
    selectedAccountId.value = null;
  };

  const updateAccount = (account, newAccount) => {
    for (const key in newAccount) {
      console.log(key, newAccount[key]);
      account[key] = newAccount[key];
    }
    account.lastUpdateAt = new Date().toLocaleString();
  };

  return {
    // 狀態
    title,
    drawer,
    loading,
    version,
    lastVersion,
    accounts,
    selectedAccountId,

    showType,

    isLoggingIn,
    isApproving,
    isSendFriendRequest,
    isFreeFeeding,
    isGettingPlayerResources,
    isGettingFriendList,
    isDeletingFriends,
    isCancellingFriendRequest,
    isRejectingFriendRequest,

    // 計算屬性
    selectedAccount,

    // Actions
    toggleDrawer,
    setLoading,
    loadAccounts,
    login,
    logout,
    getPlayerResources,
    approve,
    stopApprove,
    startSendFriendRequest,
    stopSendFriendRequest,
    startFreeFeed,
    stopFreeFeed,
    getFriendList,
    deleteFriend,
    deleteAllFriends,
    cancelAllFriendRequest,
    rejectAllFriendRequest,
    selectAccount,
    clearSelectedAccount,
  };
});
