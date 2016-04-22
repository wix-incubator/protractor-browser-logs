
function or(a, b) {
  return message => a(message) || b(message);
}

function and(a, b) {
  return message => a(message) && b(message);
}

function byLevel(expectedLevel) {
  return message => message.level.name === expectedLevel;
}

function byText(text) {
  return message => message.message.indexOf(text) !== -1;
}

function byRegExp(re) {
  return message => message.message.match(re);
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
  var matchers = args.map(arg => {
    if (typeof arg === 'string') {
      return byText(arg);
    } else if (arg instanceof RegExp) {
      return byRegExp(arg);
    } else {
      return arg;
    }
  });
  return message => matchers.every(curr => curr(message));
}

function removeMatchingMessages(messages, filters) {
  return messages.filter(message => {
    return !filters.filter(filter => filter(message)).length;
  });
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

    or,
    and,
    reset,

    ignore: (...args) => ignores.push(matcherFor(args)),
    expect: (...args) => expects.push(matcherFor(args)),

    verify: () => browser.getCapabilities().then(cap => {
      if (cap.caps_.browserName !== 'chrome') {
        return;
      }

      return logs().then(messages => {
        var zipped = zip(expects,
          removeMatchingMessages(messages, ignores));

        for (var i = 0; i < zipped.length; i++) {
          if (!zipped[i].actual) {
            throw new Error('NO MESSAGE TO EXPECT');
          }
          if (!zipped[i].expected || !zipped[i].expected(zipped[i].actual)) {
            throw new Error('UNEXPECTED MESSAGE: ' + JSON.stringify({
              level: zipped[i].actual.level.name,
              message: zipped[i].actual.message
            }));
          }
        }

        return;
      });
    })
  };

};
