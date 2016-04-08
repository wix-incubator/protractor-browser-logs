
const q = require('bluebird');


function or(a, b) {
  return function (message) {
    return a(message) || b(message);
  };
}

function and(a, b) {
  return function (message) {
    return a(message) && b(message);
  };
}

function byLevel(expectedLevel) {
  return function (message) {
    return message.level.name === expectedLevel;
  };
}

function byText(text) {
  return function (message) {
    return message.message.indexOf(text) !== -1;
  };
}

function byRegExp(re) {
  return function (message) {
    return message.message.match(re);
  };
}

function zip(a, b) {
  var total = Math.max(a.length, b.length);
  var result = [];
  for (var i = 0; i < total; i++) {
    result.push([
      a[i] ? a[i] : null,
      b[i] ? b[i] : null
    ]);
  }
  return result;
}

function matcherFor() {
  var matchers = [];
  for (var i = 0; i < arguments.length; i++) {
    if (typeof arguments[i] === 'string') {
      matchers.push(byText(arguments[i]));
    } else if (arguments[i] instanceof RegExp) {
      matchers.push(byRegExp(arguments[i]));
    } else {
      matchers.push(arguments[i]);
    }
  }
  return function (message) {
    return matchers.reduce(function (acc, curr) {
      return acc && curr(message);
    }, true);
  };
}

function removeMatchingMessages(messages, filters) {
  return messages.filter(function (message) {
    return !filters.find(function (filter) {
      return filter(message);
    });
  });
}

module.exports = function (browser) {

  var ignores = [],
      expects = [],
      log     = [];

  function logs() {
    return browser.manage().logs().get('browser').then(function (result) {
      log = log.concat(result);
      return log;
    });
  }

  return {

    ERROR:   byLevel('SEVERE'),
    WARNING: byLevel('WARNING'),
    DEBUG:   byLevel('DEBUG'),
    INFO:    byLevel('INFO'),
    LOG:     byLevel('INFO'),

    or:  or,
    and: and,

    reset: function () {
      log.splice(0, log.length);
      expects.splice(0, expects.length);
      ignores.splice(0, ignores.length);
    },

    ignore: function () { ignores.push(matcherFor.apply(this, arguments)); },
    expect: function () { expects.push(matcherFor.apply(this, arguments)); },

    verify: function () {
      return browser.getCapabilities().then(function (cap) {

        if (cap.caps_.browserName !== 'chrome') {
          return q.resolve();
        }

        return logs().then(function (messages) {
          var zipped = zip(expects,
            removeMatchingMessages(messages, ignores));

          for (var i = 0; i < zipped.length; i++) {
            if (!zipped[i][1]) {
              return q.reject(new Error('NO MESSAGE TO EXPECT'));
            }
            if (!zipped[i][0] || !zipped[i][0](zipped[i][1])) {
              return q.reject(new Error('UNEXPECTED MESSAGE: ' + JSON.stringify({
                level: zipped[i][1].level.name,
                message: zipped[i][1].message
              })));
            }
          }

          return q.resolve();
        });
      });
    }
  };

};
