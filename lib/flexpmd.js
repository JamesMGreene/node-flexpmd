/*
 * flexpmd
 * https://github.com/JamesMGreene/node-flexpmd
 *
 * Copyright (c) 2014 James M. Greene
 * Licensed under the MIT license.
 */

'use strict';

// Node core modules
var path = require('path');
var fs = require('fs');

// Node userland modules
var glob = require('glob').sync;


var mainDir = path.join(__dirname, 'flex_pmd');
var version = require('../package.json').version;
var shortVersion = parseFloat(version);
var cmdPath = path.join(mainDir, 'flex-pmd-command-line-' + shortVersion + '.jar');

if (!fs.existsSync(cmdPath)) {
  var possibleCmds = glob('flex-pmd-command-line-!(api-)*.jar', { cwd: mainDir, nocase: true });
  var i = 0;
  var len = possibleCmds.length;
  if (len > 0) {
    for (; i < len; i++) {
      if (/(^|[\/])flex-pmd-command-line(-[0-9]+(\.[0-9]+)*)?\.jar$/.test(possibleCmds[i])) {
        cmdPath = possibleCmds[i];
        break;
      }
    }
  }
  else {
    cmdPath = null;
  }
}

module.exports = {
  path: mainDir,
  cmd: cmdPath
};