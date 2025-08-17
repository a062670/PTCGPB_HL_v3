import socketApiService from "../api.js";
import toastService from "../toast.js";

const { ref, computed } = Vue;
const { defineStore } = Pinia;

// 任務 Store
export const useMissionStore = defineStore("mission", () => {
  const isRunning = ref(false);

  const runDailyMission = async (account) => {
    isRunning.value = true;
    const responseMissionGroupRewardStepStates =
      await socketApiService.getMissionGroupRewardStepStates(account.id, [
        "MI_GR_RS_0002010_DAILY_01_01",
      ]);
    const find = responseMissionGroupRewardStepStates.data.statesList.find(
      (item) => item.missionGroupRewardStepId === "MI_GR_RS_0002010_DAILY_01_01"
    );
    if (!find) {
      toastService.error("每日任務查詢失敗！");
      isRunning.value = false;
      return;
    }
    if (find.isCleared) {
      toastService.error("每日任務已完成！");
      isRunning.value = false;
      return;
    }

    let missionIds = [
      "MI_AC_0002010_12_001",
      "MI_AC_0002010_12_002",
      "MI_AC_0002010_12_003",
      "MI_AC_0002010_12_004",
      "MI_AC_0002010_12_005",
    ];
    const responseMissionIsCompleted =
      await socketApiService.getMissionIsCompleted(account.id, missionIds);
    let completedCount = 0;
    missionIds = missionIds.filter(
      (missionId) =>
        !responseMissionIsCompleted.data.completedMissionsList.find(
          (item) => item.missionId === missionId
        )
    );
    if (missionIds.length > 0) {
      try {
        await socketApiService.completeMission(account.id, missionIds);
        completedCount++;
      } catch (error) {
        toastService.error("單獨任務失敗！");
        isRunning.value = false;
        return;
      }
    }
    try {
      await socketApiService.completeMissionGroupRewardStep(account.id, [
        "MI_GR_RS_0002010_DAILY_01_01",
      ]);
      toastService.success("每日任務成功！");
    } catch (error) {
      toastService.error("每日任務失敗！");
    }

    isRunning.value = false;
  };

  return {
    isRunning,
    runDailyMission,
  };
});
