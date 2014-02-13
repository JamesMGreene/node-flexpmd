// nodeunit-based Functionality Tests

'use strict';

// Node core modules
var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

// Node userland modules
var xpath = require('xpath');
var xmldom = require('xmldom');

// Internal modules
var flexPmd = require('../lib/flexpmd');


var tmpDirBad = typeof os.tmpdir === 'function' ? os.tmpdir() : os.tmpDir();
var tmpDirGood = typeof os.tmpdir === 'function' ? os.tmpdir() : os.tmpDir();


var safeDelete = function(path) {
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    }
    catch (err) {
      // Swallow it
    }
  }
};

module.exports = {

  testDownloadAndToolExposure: function(test) {
    test.expect(6);

    test.ok(flexPmd.path, 'should have main directory path set');
    test.ok(fs.existsSync(flexPmd.path), 'should have main directory path equal to an existing item');
    test.ok(fs.statSync(flexPmd.path).isDirectory(), 'should have main directory path equal to an existing DIRECTORY');
    test.ok(flexPmd.cmd, 'should have command line JAR path set');
    test.ok(fs.existsSync(flexPmd.cmd), 'should have command line JAR path equal to an existing item');
    test.ok(fs.statSync(flexPmd.cmd).isFile(), 'should have command line JAR path equal to an existing FILE');

    test.done();
  },

  testUsageInfoDisplay: function(test) {
    test.expect(3);

    var executable = 'java';
    var childArgs = ['-Xmx256m', '-jar', flexPmd.cmd];

    childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
      test.equal(err, null, 'should not throw an error while executing the child process' + (err || ''));

      var stdoutLower = stdout.toLowerCase();
      var stderrLower = stderr.toLowerCase();

      var noFailures = stdoutLower.indexOf('fail') === -1 && stderrLower.indexOf('fail') === -1;
      var noErrors = stdoutLower.indexOf('error') === -1 && stderrLower.indexOf('error') === -1;

      test.ok(noFailures, 'should show the usage information successfully without failures');
      test.ok(noErrors, 'should show the usage information successfully without errors');

      test.done();
    });
  },

  testRealRunFailure: {
    setUp: function(done) {
      safeDelete(path.join(tmpDirBad, 'pmd.xml'));
      done();
    },
    tearDown: function(done) {
      safeDelete(path.join(tmpDirBad, 'pmd.xml'));
      done();
    },
    testIt: function(test) {
      test.expect(9);

      var inputDir = path.join(__dirname, 'testData', 'bad');
      var outputFile = path.join(tmpDirBad, 'pmd.xml');

      var executable = 'java';
      var childArgs = ['-Xmx256m', '-jar', flexPmd.cmd, '-s', inputDir, '-o', tmpDirBad];  // , '-r', './myCustomRuleset.xml'];

      test.strictEqual(fs.existsSync(outputFile), false, 'should have output file equal to an existing item');

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        test.equal(err, null, 'should not throw an error while executing the child process' + (err || ''));

        var stdoutLower = stdout.toLowerCase();
        var stderrLower = stderr.toLowerCase();

        var noFailures = stdoutLower.indexOf('fail') === -1 && stderrLower.indexOf('fail') === -1;
        var noErrors = stdoutLower.indexOf('error') === -1 && stderrLower.indexOf('error') === -1;

        test.ok(noFailures, 'should not show any failures');
        test.ok(noErrors, 'should not show any errors');

        test.strictEqual(fs.existsSync(outputFile), true, 'should have output file equal to an existing item');
        test.strictEqual(fs.statSync(outputFile).isFile(), true, 'should have output file equal to an existing FILE');

        var xml = fs.readFileSync(outputFile, { encoding: 'utf8' });
        var doc = (new xmldom.DOMParser()).parseFromString(xml);
        var nodes = xpath.select("//violation", doc);
        test.notEqual(nodes, null);
        test.strictEqual(typeof nodes.length, 'number');
        test.strictEqual(nodes.length > 0, true, 'output file should contain violations (' + nodes.length + ')');

        test.done();
      });
    }
  },

  testRealRunSuccess: {
    setUp: function(done) {
      safeDelete(path.join(tmpDirGood, 'pmd.xml'));
      done();
    },
    tearDown: function(done) {
      safeDelete(path.join(tmpDirGood, 'pmd.xml'));
      done();
    },
    testIt: function(test) {
      test.expect(9);

      var inputDir = path.join(__dirname, 'testData', 'good');
      var outputFile = path.join(tmpDirGood, 'pmd.xml');

      var executable = 'java';
      var childArgs = ['-Xmx256m', '-jar', flexPmd.cmd, '-s', inputDir, '-o', tmpDirGood];  // , '-r', './myCustomRuleset.xml'];

      test.strictEqual(fs.existsSync(outputFile), false, 'should have output file equal to an existing item');

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        test.equal(err, null, 'should not throw an error while executing the child process' + (err || ''));

        var stdoutLower = stdout.toLowerCase();
        var stderrLower = stderr.toLowerCase();

        var noFailures = stdoutLower.indexOf('fail') === -1 && stderrLower.indexOf('fail') === -1;
        var noErrors = stdoutLower.indexOf('error') === -1 && stderrLower.indexOf('error') === -1;

        test.ok(noFailures, 'should not show any failures');
        test.ok(noErrors, 'should not show any errors');

        test.strictEqual(fs.existsSync(outputFile), true, 'should have output file equal to an existing item');
        test.strictEqual(fs.statSync(outputFile).isFile(), true, 'should have output file equal to an existing FILE');

        var xml = fs.readFileSync(outputFile, { encoding: 'utf8' });
        var doc = (new xmldom.DOMParser()).parseFromString(xml);
        var nodes = xpath.select("//violation", doc);
        test.notEqual(nodes, null);
        test.strictEqual(typeof nodes.length, 'number');
        test.strictEqual(nodes.length, 0, 'output file should NOT contain violations');

        test.done();
      });
    }
  }

};