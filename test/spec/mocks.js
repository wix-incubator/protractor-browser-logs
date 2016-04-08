
const q = require('bluebird');


module.exports.console = (logs) => {

  function log(level) {
    return function (message) {
      logs.push({level: level, message: message});
    };
  }

  return {
    log  : log('INFO'),
    info : log('INFO'),
    error: log('SEVERE'),
    warn : log('WARNING'),
    debug: log('DEBUG')
  };

};

module.exports.browser = (logs, browserName) => {
    return {
      getCapabilities() {
        return q.resolve({
          caps_: {
            browserName: browserName || 'chrome'
          }
        });
      },
      manage() {
        return {
          logs() {
            return {
              get(type) {
                return type === 'browser' ?
                  q.resolve(logs.splice(0, logs.length)) :
                  q.reject();
              }
            };
          }
        };
      }
    };
};
