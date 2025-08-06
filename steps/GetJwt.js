const axios = require("axios");
const serverConfig = require("../config/server.json");

const getJwt = async () => {
  const res = await axios.get(serverConfig.server + "/jwt");
  return res.data;
};

module.exports = { getJwt };
