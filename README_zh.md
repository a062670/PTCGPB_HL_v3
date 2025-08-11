# 寶可夢集換式卡牌遊戲機器人 (PTCGPB_HL_v3)

一個基於 Node.js 的寶可夢集換式卡牌遊戲手機應用程式自動化機器人。此機器人提供帳號管理、好友請求、開包和各種遊戲互動的自動化功能，以及用於手動操作的現代化網頁介面。

## 🎯 功能特色

### 核心功能
- **帳號管理**: 自動登入和會話管理
- **好友系統**: 自動批准好友請求，管理好友列表
- **開包操作**: 自動開包，智能治療系統
- **社交功能**: 分享開包結果，查看好友動態
- **多帳號支援**: 同時管理多個遊戲帳號
- **網頁介面**: 基於 Vue.js 的現代化網頁應用程式，用於手動操作

### 自動化功能
- **自動批准好友**: 自動接受 incoming 好友請求
- **會話管理**: 處理登入會話，自動續期
- **Discord 整合**: 機器人活動的 Webhook 通知
- **錯誤恢復**: 自動重試機制，指數退避

### 網頁介面功能
- **即時操作**: 基於 Socket.IO 的即時通訊
- **帳號管理**: 在多個遊戲帳號間切換
- **開包操作**: 手動開包和管理
- **好友管理**: 發送、批准、拒絕好友請求
- **社交動態**: 查看和互動好友活動
- **牌組管理**: 查看和管理卡牌牌組
- **事件戰鬥**: 參與特殊遊戲事件

## 🏗️ 專案結構

```
PTCGPB_HL_v3/
├── config/                 # 配置檔案
│   ├── main.json          # 主要機器人配置
│   ├── main.json.example  # 主要機器人配置模板
│   ├── server.json        # 伺服器配置
│   ├── server.json.example # 伺服器配置模板
│   ├── static.json        # 靜態應用程式配置
│   ├── pack.json          # 卡包配置
│   └── eventBattle.json   # 事件戰鬥配置
├── lib/                    # 核心函式庫
│   ├── Grpc.js            # gRPC 通訊層
│   ├── client.js          # gRPC 客戶端管理
│   ├── axiosClient.js     # HTTP 客戶端包裝
│   ├── Units.js           # 工具函數
│   └── packer/            # 資料加密/解密
├── steps/                  # 遊戲操作模組
│   ├── Login.js           # 身份驗證
│   ├── SystemClient.js    # 系統操作
│   ├── PlayerProfileClient.js # 個人資料管理
│   ├── FriendClient.js    # 好友系統操作
│   ├── PackClient.js      # 卡包管理
│   ├── PackShopClient.js  # 商店操作
│   ├── FeedClient.js      # 社交動態操作
│   ├── OpenPack.js        # 開包邏輯
│   └── GetJwt.js          # JWT 令牌獲取
├── server/                 # 伺服器組件
│   ├── server.js          # Express + Socket.IO 伺服器
│   └── actions.js         # 伺服器端操作
├── client/                 # 網頁介面
│   ├── index.html         # 主要應用程式入口
│   ├── app.html           # 應用程式介面
│   ├── login.html         # 登入頁面
│   ├── main.js            # Vue.js 應用程式
│   ├── api.js             # API 客戶端
│   ├── toast.js           # Toast 通知
│   └── stores/            # Pinia 狀態管理
├── tester/                 # 互動式測試工具
├── generated/              # 生成的檔案
├── approve.js             # 主要自動化腳本
├── start.bat              # Windows 啟動腳本
└── package.json           # 依賴項和專案資訊
```

## 🚀 安裝

### 前置需求
- Node.js 22.2.0 (在 package.json 中指定)
- npm 或 yarn 套件管理器

### 設定步驟

1. **複製儲存庫**
   ```bash
   git clone <repository-url>
   cd PTCGPB_HL_v3
   ```

2. **安裝依賴項**
   ```bash
   npm install
   ```

3. **配置機器人**
   ```bash
   # 複製配置模板（如果尚未存在）
   cp config/main.json.example config/main.json
   cp config/server.json.example config/server.json
   ```

4. **編輯配置檔案**
   - `config/main.json`: 新增您的遊戲帳號和 Discord webhook
   - `config/server.json`: 配置 JWT 伺服器端點

## ⚙️ 配置

### 主要配置 (`config/main.json`)

```json
{
  "deviceAccounts": [
    {
      "id": "您的遊戲帳號ID",
      "password": "您的遊戲密碼"
    }
  ],
  "reLoginWaitTime": 10,
  "testAccount": {
    "id": "測試帳號ID",
    "password": "測試帳號密碼"
  },
  "auth": {
    "enable": false,
    "username": "網頁使用者名稱",
    "password": "網頁密碼",
    "secret": "會話密鑰"
  },
  "webhook": "您的discord_webhook_url"
}
```

### 伺服器配置 (`config/server.json`)

```json
{
  "server": "https://your-jwt-server.com"
}
```

## 🎮 使用方法

### 網頁介面（推薦）

啟動網頁伺服器並存取現代化介面：

```bash
npm run start-server
```

網頁介面將自動在 `http://localhost:9487/` 開啟

**網頁介面可用功能：**
- 帳號切換和管理
- 登入/註冊
- 個人資料管理
- 開包和管理
- 好友請求管理
- 社交動態查看
- 牌組管理
- 事件戰鬥參與
- 商品商店操作

### 互動式測試工具

執行互動式測試器進行手動操作：

```bash
node tester/tester.js
```

可用操作：
- 帳號切換
- 登入/註冊
- 個人資料管理
- 開包
- 好友管理
- 社交動態查看

### 自動化機器人

執行主要自動化腳本：

```bash
node approve.js
```

機器人將：
1. 自動登入配置的帳號
2. 監控並批准好友請求
3. 發送通知到 Discord webhook
4. 處理會話續期和錯誤恢復

## 🔧 關鍵組件

### 網頁伺服器
- **Express.js**: HTTP 伺服器框架
- **Socket.IO**: 即時雙向通訊
- **會話管理**: 網頁介面的可選身份驗證
- **靜態檔案服務**: Vue.js 應用程式託管

### 身份驗證系統
- 基於 JWT 的身份驗證，使用外部伺服器
- 會話令牌管理
- 自動登入續期
- 可選的網頁介面身份驗證

### gRPC 通訊
- 與遊戲伺服器的加密通訊
- 自動重試，指數退避
- 各種網路條件的錯誤處理

### 好友管理
- 自動批准好友請求
- 好友列表監控
- 請求管理（發送/取消/拒絕）

### 開包操作
- 智能開包，治療系統
- 交易追蹤
- 卡片結果記錄

## 🛡️ 安全功能

- 加密的 gRPC 通訊
- 會話令牌管理
- 安全的憑證儲存
- 速率限制和重試機制
- 可選的網頁介面身份驗證

## 📊 監控

### Discord 整合
機器人可以透過 webhook 發送通知到 Discord：
- 登入成功/失敗通知
- 好友請求批准
- 錯誤警報

### 日誌記錄
- 基於控制台的時間戳記日誌
- 錯誤追蹤和報告
- 效能監控

## 🔄 自動化功能

### 會話管理
- 每 50 分鐘自動會話續期
- 優雅處理登入衝突
- 指數退避的錯誤恢復

### 好友請求自動化
- 持續監控 incoming 請求
- 自動批准，速率限制
- 衝突檢測和解決

## 🚨 錯誤處理

機器人包含全面的錯誤處理：
- 網路錯誤恢復
- 會話衝突解決
- 速率限制管理
- 優雅降級

## 📝 依賴項

- `@grpc/grpc-js`: gRPC 通訊
- `axios`: HTTP 客戶端
- `express`: 網頁伺服器框架
- `express-session`: 會話管理
- `socket.io`: 即時通訊
- `google-protobuf`: Protocol buffer 支援
- `inquirer`: 互動式 CLI
- `uuid`: 唯一識別碼生成
- `open`: 自動開啟瀏覽器

## 🚀 快速開始

1. **安裝依賴項**: `npm install`
2. **配置帳號**: 編輯 `config/main.json`
3. **啟動網頁介面**: `npm run start-server`
4. **存取位置**: `http://localhost:9487/`

## ⚠️ 免責聲明

此機器人僅供教育和個人使用。請確保遵守遊戲的服務條款並負責任地使用。開發者不對遊戲管理員採取的任何帳號行動負責。

## 🤝 貢獻

1. Fork 儲存庫
2. 建立功能分支
3. 進行您的更改
4. 徹底測試
5. 提交 pull request

## 📄 授權

此專案採用 ISC 授權。

## 🆘 支援

對於問題和疑問：
1. 檢查現有問題
2. 建立新問題，包含詳細資訊
3. 包含日誌和配置詳細資訊

---

**注意**: 此機器人與寶可夢集換式卡牌遊戲手機應用程式互動。請自擔風險使用，並確保遵守遊戲的服務條款。 