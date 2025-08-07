const fs = require("fs");
const path = require("path");

let mainConfig;
let accounts;

exports.reloadConfig = () => {
  mainConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "config", "main.json"), "utf8")
  );
  accounts = mainConfig.deviceAccounts.map((acc) => ({
    ...acc,
    headers: {},
    nickname: "",
    nextLoginAt: 0,
    isLogin: false,
  }));
};

exports.getAccounts = () => {
  if (!accounts) {
    console.warn("accounts 未初始化，重新載入配置");
    exports.reloadConfig();
  }
  return accounts || [];
};
