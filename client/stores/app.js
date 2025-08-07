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
  const selectedAccount = ref(null);

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
      accounts.value = accountsData;
      toastService.success("帳號列表載入成功");
    } catch (error) {
      console.error("Socket API 錯誤:", error);
      toastService.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (account) => {
    selectedAccount.value = account;
  };

  const clearSelectedAccount = () => {
    selectedAccount.value = null;
  };

  return {
    // 狀態
    title,
    drawer,
    loading,
    accounts,
    selectedAccount,

    // Actions
    toggleDrawer,
    setLoading,
    loadAccounts,
    selectAccount,
    clearSelectedAccount,
  };
});
