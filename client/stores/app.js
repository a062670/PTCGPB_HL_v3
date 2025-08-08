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

  // 帳號相關狀態
  const accounts = ref([]);
  const selectedAccountId = ref(null);

  // 資料相關
  const showType = ref("feedList");
  const feedList = ref({});

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
      const result = await socketApiService.getAccounts();
      const accountsData = result.data?.accounts || [];
      accounts.value = accountsData.map((account) => ({
        ...account,
        isLoggingIn: false,
        isApproving: false,
        isDeletingFriends: false,
        isGettingFeedList: false,
        isGettingPresentBoxList: false,
        lastUpdateAt: new Date().toLocaleString(),
      }));

      // 設置通知監聽器
      setupNotificationListeners();

      toastService.success("帳號列表載入成功");
    } catch (error) {
      console.error("Socket API 錯誤:", error);
      toastService.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (account) => {
    account.isLoggingIn = true;
    const result = await socketApiService.login(account.id);
    updateAccount(account, result.data);
    account.isLoggingIn = false;
  };

  const logout = async (account) => {
    account.isLoggingIn = true;
    const result = await socketApiService.logout(account.id);
    updateAccount(account, result.data);
    account.isLoggingIn = false;
  };

  const approve = async (account) => {
    account.isApproving = true;
    const result = await socketApiService.approve(account.id);
    updateAccount(account, result.data);
    account.isApproving = false;
  };

  const stopApprove = async (account) => {
    account.isApproving = true;
    const result = await socketApiService.stopApprove(account.id);
    updateAccount(account, result.data);
    account.isApproving = false;
  };

  const deleteAllFriends = async (account) => {
    account.isDeletingFriends = true;
    const result = await socketApiService.deleteAllFriends(account.id);
    updateAccount(account, result.data);
    account.isDeletingFriends = false;
  };

  const getFeedList = async (account) => {
    account.isGettingFeedList = true;
    const result = await socketApiService.getFeedList(account.id);
    feedList.value = {
      ...result.data,
      renewAfter: new Date(result.data.renewAfter * 1000).toLocaleString(),
    };
    account.isGettingFeedList = false;
  };

  const clearFeedList = () => {
    feedList.value = {};
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
    accounts,
    selectedAccountId,
    showType,
    feedList,

    // 計算屬性
    selectedAccount,

    // Actions
    toggleDrawer,
    setLoading,
    loadAccounts,
    login,
    logout,
    approve,
    stopApprove,
    deleteAllFriends,
    getFeedList,
    clearFeedList,
    selectAccount,
    clearSelectedAccount,
  };
});
