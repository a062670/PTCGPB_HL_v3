import { useAppStore } from "./stores/app.js";
import { useThemeStore } from "./stores/theme.js";
import { usePresentBoxStore } from "./stores/presentBox.js";
import { useFeedStore } from "./stores/feed.js";
import { useEventBattleStore } from "./stores/eventBattle.js";
import { usePackStore } from "./stores/pack.js";
import { useItemShopStore } from "./stores/itemShop.js";

import toastService from "./toast.js";

const { ref, createApp, onMounted, computed } = Vue;
const { createPinia } = Pinia;
const { createVuetify, useTheme } = Vuetify;

// 建立 Vuetify 實例，啟用 dark mode 和綠色主題
const vuetify = createVuetify({
  theme: {
    defaultTheme: "dark",
    themes: {
      dark: {
        colors: {
          primary: "#4CAF50", // 綠色
          secondary: "#81C784",
          accent: "#66BB6A",
          gray: "#9E9E9E",
        },
      },
      light: {
        colors: {
          primary: "#4CAF50", // 綠色
          secondary: "#81C784",
          accent: "#66BB6A",
          gray: "#9E9E9E",
        },
      },
    },
  },
});

// 載入 template
async function loadTemplate() {
  const response = await fetch("./app.html");
  const template = await response.text();

  // 建立 Pinia
  const pinia = createPinia();

  // 建立 Vue 應用程式
  const app = createApp({
    setup() {
      // 使用 Stores
      const appStore = useAppStore();
      const themeStore = useThemeStore();
      const presentBoxStore = usePresentBoxStore();
      const feedStore = useFeedStore();
      const eventBattleStore = useEventBattleStore();
      const packStore = usePackStore();
      const itemShopStore = useItemShopStore();

      const theme = useTheme();

      // 主題切換功能
      const toggleTheme = () => {
        themeStore.toggleTheme();
        theme.global.name.value = themeStore.themeName;
      };

      // onMounted 生命週期鉤子
      onMounted(() => {
        console.log("Layout 已掛載完成！");

        // 載入帳號列表
        appStore.loadAccounts();
      });

      return {
        appStore,
        themeStore,
        presentBoxStore,
        feedStore,
        eventBattleStore,
        packStore,
        itemShopStore,

        toggleTheme,
      };
    },
    template: template,
  });

  // 使用 Pinia
  app.use(pinia);

  // 使用 Vuetify
  app.use(vuetify);

  // 掛載應用程式
  app.mount("#app");
}

// 啟動應用程式
loadTemplate();
