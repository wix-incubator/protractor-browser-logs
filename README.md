# Protractor browser logs assertion library

Provides tools for asserting browser logs inside protractor tests.
Inspired by https://github.com/angular/protractor-console-plugin/

### Installation

```bash
npm install protractor-browser-logs --save-dev
```

### Typical library usage

```js
var logs = require('protractor-browser-logs');

describe('Home page:', function () {

  it('should log an error after clicking a button', function () {
    logs.ignore(logs.DEBUG);
    logs.ignore(logs.INFO);
    logs.expect(/server request failed/g);

    browser.get('...');
    element(by.id('button')).click();

    return logs.verify();
  });

});
```

### Using advanced features

```js
var logs = require('protractor-browser-logs');

describe('Home page:', function () {

  beforeEach(function () {
    // Skip all DEBUG and INFO messages and any containing Oops
    logs.ignore(logs.or(logs.DEBUG, logs.INFO));
    logs.ignore(function (message) {
      return message.message.indexOf('Oops') !== -1;
    });
  });

  it('should log an error after clicking a button', function () {
    logs.expect(/retrying/g, logs.WARN);
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
  var logs = require('protractor-browser-logs');
  global['logs'] = logs;

  beforeEach(function () {
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
