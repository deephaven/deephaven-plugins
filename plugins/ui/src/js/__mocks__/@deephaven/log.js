const Log = {
  module: () => ({
    debug: jest.fn().mockName('debug'),
    debug2: jest.fn().mockName('debug2'),
    error: jest.fn().mockName('error'),
    info: jest.fn().mockName('info'),
    log: jest.fn().mockName('log'),
    warn: jest.fn().mockName('warn'),
  }),
  setLogLevel: jest.fn().mockName('setLogLevel'),
};

module.exports = Log;
module.exports.Log = Log;
