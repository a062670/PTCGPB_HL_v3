// 簡單的 Toast 通知系統
class ToastService {
  constructor() {
    this.toasts = [];
    this.container = null;
    this.init();
  }

  init() {
    // 創建 toast 容器
    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    const id = Date.now() + Math.random();

    // 設置樣式
    const colors = {
      success: "#4CAF50",
      error: "#F44336",
      warning: "#FF9800",
      info: "#2196F3",
    };

    toast.style.cssText = `
      background: ${colors[type] || colors.success};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
      font-size: 14px;
      min-width: 200px;
      max-width: 300px;
      word-wrap: break-word;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    `;

    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px; font-size: 16px;">
          ×
        </button>
      </div>
    `;

    // 添加到容器
    this.container.appendChild(toast);

    // 動畫進入
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    }, 10);

    // 自動移除
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    // 點擊關閉
    toast.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") {
        this.remove(toast);
      }
    });

    return toast;
  }

  remove(toast) {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, duration = 3000) {
    return this.show(message, "success", duration);
  }

  error(message, duration = 3000) {
    return this.show(message, "error", duration);
  }

  warning(message, duration = 3000) {
    return this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    return this.show(message, "info", duration);
  }
}

// 創建全局實例
const toastService = new ToastService();

// 導出
export default toastService;
