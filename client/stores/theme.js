const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 主題管理 Store
export const useThemeStore = defineStore("theme", () => {
  // 狀態
  const isDark = ref(true);

  // 計算屬性
  const themeIcon = computed(() => {
    return isDark.value ? "mdi-weather-sunny" : "mdi-weather-night";
  });

  const themeName = computed(() => {
    return isDark.value ? "dark" : "light";
  });

  // Actions
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  const setTheme = (dark) => {
    isDark.value = dark;
  };

  const setDarkTheme = () => {
    isDark.value = true;
  };

  const setLightTheme = () => {
    isDark.value = false;
  };

  return {
    // 狀態
    isDark,

    // 計算屬性
    themeIcon,
    themeName,

    // Actions
    toggleTheme,
    setTheme,
    setDarkTheme,
    setLightTheme,
  };
});
