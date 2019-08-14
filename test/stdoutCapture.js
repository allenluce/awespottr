// A new it() for capturing console output in Mocha. Avoids the
// problem of Mocha's reporters outputting to stdout before
// afterEach() is called resulting in no reporter output.
//
// Use this in place of Mocha's standard it(). At the top of your
// Mocha file:
//
// const it = require('./stdoutCapture')
//
// Within the test, anything printed to stdout is added to the
// it.inspect.output array. Assert against it within your test:
//
// expect(it.inspect.output).to.deep.equal(["Rebooting outlet 2...", "\n"])
//

const stdout = require("test-console").stdout

const restoreAfterRun = testCase => async function () {
  module.exports.inspect = stdout.inspect()
  try {
    return await testCase.bind(this)()
  } finally {
    module.exports.inspect.restore()
  }
}

module.exports = (description, testCase) => global.it(description, restoreAfterRun(testCase))
module.exports.only = (description, testCase) => global.it.only(description, restoreAfterRun(testCase))
module.exports.skip = global.it.skip
module.exports.retries = global.it.retries
