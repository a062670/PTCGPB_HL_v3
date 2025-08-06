const { AsyncLocalStorage } = require("async_hooks");
const threadContext = new AsyncLocalStorage();

module.exports = threadContext;
