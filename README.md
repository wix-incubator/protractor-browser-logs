# Protractor browser logs assertion library

Provides tools for asserting browser logs inside protractor tests.
Inspired by https://github.com/angular/protractor-console-plugin/

### Installation

```bash
npm install https://github.com/mastertheblaster/protractor-browser-logs.git --save-dev
```

### Typical library usage

```js
var browserLogs = require('protractor-browser-logs');

describe('Home page:', function () {

  var logs;

  beforeEach(function () {
    logs = browserLogs(browser);
    logs.ignore(logs.DEBUG);
    logs.ignore(logs.INFO);
  });

  afterEach(function () {
    return logs.verify();
  });

  it('should log an error after clicking a button', function () {
    logs.expect(/server request failed/g);

    browser.get('...');
    element(by.id('button')).click();
  });

});
```

### Using advanced features

```js
var browserLogs = require('protractor-browser-logs');

describe('Home page:', function () {

  var log = browserLogs(browser);

  beforeEach(function () {
    // Use only one instance, but need to reset before each test.
    log.reset();

    // Combine matcher functions
    logs.ignore(logs.or(logs.DEBUG, logs.INFO));

    // Specify custom matcher function
    logs.ignore(function (message) {
      return message.message.indexOf('Oops') !== -1;
    });
  });

  it('should log an error after clicking a button', function () {
    // The sequence of expectations does matter
    logs.expect(/retrying/g, logs.WARN); // Expect message having "retrying" text and WARNING level.
    logs.expect(/server request failed/g, logs.ERROR);

    browser.get('...');
    element(by.id('button')).click();
  });

  afterEach(function () {
    return logs.verify();
  });

});
```

### Sharing the code inside a protractor configuration file

```js
onPrepare = function () {

  var browserLogs = require('protractor-browser-logs'),
      logs = browserLogs(browser);

  if (global.logs) {
    throw new Error('Oops, name is already reserved!');
  }
  global.logs = logs;

  beforeEach(function () {
    logs.reset();

    // You can put here all expected generic expectations.
    logs.ignore('cast_sender.js');
    logs.ignore('favicon.ico');

    logs.ignore(logs.or(logs.INFO, logs.DEBUG));
  });

  afterEach(function () {
    return logs.verify();
  });
};
```

### Protractor capabilities configuration

```js
capabilities: {
  loggingPrefs: {
    browser: 'ALL' // "OFF", "SEVERE", "WARNING", "INFO", "CONFIG", "FINE", "FINER", "FINEST", "ALL".
  }
}
```
More details could be found here: https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities#loggingpreferences-json-object
