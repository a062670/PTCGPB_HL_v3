const { createRandomHexString } = require("../lib/Units.js");
const { getJwt } = require("./GetJwt.js");
const staticConfig = require("../config/static.json");
const axiosClient = require("../lib/axiosClient.js");

const login = async (deviceAccount = null) => {
  const jwt = await getJwt();
  const data = {
    ...staticConfig.appInfo,
    sessionId: `${createRandomHexString(16)}-${Date.now()}`,
    assertion: jwt,
    deviceAccount,
  };
  if (!deviceAccount) {
    delete data.deviceAccount;
  }
  try {
    const { data: json } = await axiosClient.post(
      "/core/v1/gateway/sdk/login",
      data
    );
    return json;
  } catch (error) {
    console.error("login error", error.response.data);
    throw new Error("login error");
  }
};

module.exports = {
  login,
};
