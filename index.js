
const q = require('bluebird');

function arr(a) {
  return Array.prototype.slice.call(a);
}

function or(a, b) {
  return function(message) {
    return a(message) || b(message);
  }
}

function and(a, b) {
  return function (message) {
    return a(message) && b(message);}
}

function byLevel(expectedLevel) {
  return function(message) { return message.level.name === expectedLevel;}
}

function byText(text) {
  return function(message) { return message.message.indexOf(text) !== -1;}
}

function byRegExp(re) {
  return function(message) { return message.message.match(re);}
}

function zip(a, b) {
  var total = Math.max(a.length, b.length);
  var result = [];
  for (var i = 0; i < total; i++) {
    result.push({expected: a[i] || null, actual: b[i] || null});
  }
  return result;
}

function matcherFor(args) {
  var matchers = args.map(function(arg) {
    if (typeof arg === 'string') {
      return byText(arg);
    } else if (arg instanceof RegExp) {
      return byRegExp(arg);
    } else {
      return arg;
    }
  });
  return function(message) { return matchers.every(function(curr) {
      return curr(message)
  })}
}

function removeMatchingMessages(messages, filters) {
  return messages.filter(function(message) {
      
    return !filters.find(function(filter ) {return filter(message)});
  });
}

// polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}


module.exports = function (browser) {

  var ignores, expects, log;

  function logs() {
    return browser.manage().logs().get('browser').then(function (result) {
      log = log.concat(result);
      return log;
    });
  }

  function reset() {
    ignores = [];
    expects = [];
    log     = [];
  }

  reset();

  return {

    ERROR:   byLevel('SEVERE'),
    WARNING: byLevel('WARNING'),
    DEBUG:   byLevel('DEBUG'),
    INFO:    byLevel('INFO'),
    LOG:     byLevel('INFO'),

    or: or,
    and: and,
    reset: reset,

    ignore: function () { ignores.push(matcherFor(arr(arguments))); },
    expect: function () { expects.push(matcherFor(arr(arguments))); },

    verify: function() {browser.getCapabilities().then(function(cap) {
      if (cap.caps_.browserName !== 'chrome') {
        return q.resolve();
      }

      return logs().then(function(messages) {
        var zipped = zip(expects,
          removeMatchingMessages(messages, ignores));

        for (var i = 0; i < zipped.length; i++) {
          if (!zipped[i].actual) {
            return q.reject(new Error('NO MESSAGE TO EXPECT'));
          }
          if (!zipped[i].expected || !zipped[i].expected(zipped[i].actual)) {
            return q.reject(new Error('UNEXPECTED MESSAGE: ' + JSON.stringify({
              level: zipped[i].actual.level.name,
              message: zipped[i].actual.message
            })));
          }
        }

        return q.resolve();
      });
    })}
  };

};
