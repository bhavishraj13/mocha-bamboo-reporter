var Base = require("mocha").reporters.Base,
  cursor = Base.cursor,
  color = Base.color,
  fs = require("fs"),
  filename = process.env.MOCHA_FILE || "mocha.json",
  append = false;
exports = module.exports = BambooJSONReporter;
/**
 * Initialize a new `JSON` reporter.
 *
 * @param {Runner} runner
 * @param {Object} options
 * @api public
 */
function BambooJSONReporter(runner, options) {
  var self = this;
  Base.call(this, runner);
  var tests = [],
    failures = [],
    passes = [],
    skipped = [];
  var initObj = { failures: [], passes: [], skipped: [] };
  if (options && options.reporterOptions && options.reporterOptions.output) {
    filename = options.reporterOptions.output;
  }
  if (
    options &&
    options.reporterOptions &&
    options.reporterOptions.append === true
  ) {
    append = true;
  }
  runner.on("test end", function (test) {
    tests.push(test);
  });
  runner.on("pending", function (test) {
    skipped.push(test);
  });
  runner.on("pass", function (test) {
    passes.push(test);
  });
  runner.on("fail", function (test) {
    failures.push(test);
  });
  runner.on("end", function () {
    var obj = {
      stats: self.stats,
      failures: failures.map(clean),
      passes: passes.map(clean),
      skipped: skipped.map(clean),
    };
    var result = {};
    if (append) {
      result = {
        ...initObj,
        ...obj,
        failures: [...initObj.failures, ...obj.failures],
        passes: [...initObj.passes, ...obj.passes],
        skipped: [...initObj.skipped, ...obj.skipped],
      };
    } else {
      result = obj;
    }
    fs.writeFileSync(filename, JSON.stringify(result, null, 2), "utf-8");
  });
  runner.on("start", function () {
    if (fs.existsSync(filename)) {
      if (append) {
        initObj = JSON.parse(fs.readFileSync(filename));
      }
      fs.unlinkSync(filename); // if we die at some point, we don't want bamboo to have a stale results file lying around...
    }
  });
}
/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */
function clean(test) {
  var o = {
    title: test.title,
    fullTitle: test.fullTitle(),
    duration: test.duration,
  };
  if (test.hasOwnProperty("err")) {
    if (test.err.stack) {
      o.error = test.err.stack.toString();
    } else if (test.err.message) {
      o.error = test.err.message;
    }
  }
  return o;
}
