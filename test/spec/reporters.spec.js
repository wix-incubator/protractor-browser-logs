
const promised = require('chai-as-promised');
const expect   = require('chai').use(promised).expect;
const logs     = require('../../index');
const mocks    = require('./mocks');


describe('Browser Logs Reporters', () => {

  it('should accept empty options', () => {
    const browserLogs = logs(mocks.browser([]), {});
    return expect(browserLogs.verify()).to.eventually.be.fulfilled;
  });

  it('should call a reporter with empty log', () => {
    var reporter = createSpy();
    var browserLogs = logs(mocks.browser([]), {reporters: [reporter]});
    return expect(browserLogs.verify()).to.eventually.be.fulfilled.then(function () {
      expect(reporter.callCount).to.equal(1);
      expect(reporter.callArguments[0]).to.deep.equal([]);
    });
  });

  it('should call a reporter with complete log', () => {
    var reporter = createSpy();
    var store = [];
    var browserConsole = mocks.console(store);
    var browserLogs = logs(mocks.browser(store), {reporters: [reporter]});

    browserLogs.ignore(/.*/);

    ['debug', 'log', 'info', 'warn', 'error'].forEach(level => {
      browserConsole[level](level);
    });

    return expect(browserLogs.verify()).to.eventually.be.fulfilled.then(() => {
      expect(reporter.callCount).to.equal(1);
      expect(reporter.callArguments[0]).to.deep.equal([
        {level: {name: 'DEBUG'}, message: 'debug'},
        {level: {name: 'INFO'}, message: 'log'},
        {level: {name: 'INFO'}, message: 'info'},
        {level: {name: 'WARNING'}, message: 'warn'},
        {level: {name: 'SEVERE'}, message: 'error'}
      ]);
    });
  });

  it('should call a reporter even if verification fails', () => {
    var reporter = createSpy();
    var store = [];
    var browserConsole = mocks.console(store);
    var browserLogs = logs(mocks.browser(store), {reporters: [reporter]});

    browserConsole.error('error');

    return expect(browserLogs.verify()).to.eventually.be.rejected.then(() => {
      expect(reporter.callCount).to.equal(1);
      expect(reporter.callArguments[0]).to.deep.equal([
        {level: {name: 'SEVERE'}, message: 'error'}
      ]);
    });
  });

  it('should call all reporters', () => {
    var reporter1 = createSpy();
    var reporter2 = createSpy();
    var browserLogs = logs(mocks.browser([]), {reporters: [reporter1, reporter2]});

    return expect(browserLogs.verify()).to.eventually.be.fulfilled.then(() => {
      expect(reporter1.callCount).to.equal(1);
      expect(reporter2.callCount).to.equal(1);
    });
  });

  function createSpy() {
    var result = function () {
      result.callCount = (result.callCount || 0) + 1;
      result.callArguments = (result.callArguments || [])[result.callCount - 1] = arguments;
    };
    return result;
  }

});
