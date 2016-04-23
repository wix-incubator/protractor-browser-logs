
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
  return (a.length > b.length ? a : b).map((x, i) => [a[i], b[i]]);
}

function matcherFor(args) {
  let matchers = args.map(arg => {
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

function removeMatching(messages, filters) {
  return messages.filter(message => {
    return filters.filter(filter => filter(message)).length === 0;
  });
}

module.exports = function (browser) {
  let ignores, expects, log;

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
      if (cap.caps_.browserName === 'chrome') {
        return logs().then(messages => {
          zip(expects, removeMatching(messages, ignores)).forEach(([expected, actual]) => {
            if (!actual) {
              throw new Error('NO MESSAGE TO EXPECT');
            }
            if (!expected || !expected(actual)) {
              throw new Error('UNEXPECTED MESSAGE: ' + JSON.stringify({
                level: actual.level.name,
                message: actual.message
              }));
            }
          });
        });
      }
    })
  };
};
