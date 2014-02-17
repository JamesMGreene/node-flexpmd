/*
 * flexpmd
 * https://github.com/JamesMGreene/node-flexpmd
 *
 * Copyright (c) 2014 James M. Greene
 * Licensed under the MIT license.
 */

/*
 * This simply downloads the requested version of the Adobe FlexPMD tool.
 */

'use strict';

var DEBUG_TRAVIS = false;
var os = require('os');
var fs = require('fs');
var path = require('path');
fs.existsSync = fs.existsSync || path.existsSync;
var url = require('url');
var https = require('follow-redirects').https;
var cp = require('child_process');
var rimrafAsync = require('rimraf')
var rimraf = rimrafAsync.sync;
var mkdirp = require('mkdirp').sync;
var AdmZip = require('adm-zip');
var D2UConverter = require('dos2unix').dos2unix;
var copyR = require('ncp').ncp;
var pkgMeta = require('./package.json');


var libPath = path.join(__dirname, 'lib', 'flex_pmd');
var tmpDir = (typeof os.tmpdir === 'function') ? os.tmpdir() : os.tmpDir();
var tmpPath = path.join(tmpDir, 'flex_pmd');
var tmpDownloadsPath = path.join(tmpPath, 'downloads');
var tmpExtractionsPath = path.join(tmpPath, 'extractions');

var downloadUrl = pkgMeta.flexPmd.url;
var fileName = downloadUrl.split('/').pop();
var downloadedFile = path.join(tmpDownloadsPath, fileName);

process.on('uncaughtException', function(err) {
  console.error('FATAL! Uncaught exception: ' + err);
  process.exit(1);
});

function getOptions() {
  var downloadUrlParts = url.parse(downloadUrl);
  var proxy = process.env.https_proxy || process.env.http_proxy;
  if (proxy) {
    var options = url.parse(proxy, false, true);
    options.path = downloadUrl;
    options.headers = { Host: downloadUrlParts.host };
    return options;
  }
  return downloadUrlParts;
}

function fixLineEndings() {
  console.log('Fixing line endings with the `dos2unix` Node module...');

  // Convert all DOS line endings (CrLf) to UNIX line endings (Lf)
  var d2uOptions = {
    glob: {
      cwd: tmpExtractionsPath
    },
    maxConcurrency: 100  /* Only open a max of 100 files at once */
  };
  var conversionEndedAlready = false;
  var errors = [];
  var dos2unix = new D2UConverter(d2uOptions)
    .on('convert.error', function(err) {
      err.type = 'convert.error';
      errors.push(err);
    })
    .on('processing.error', function(err) {
      err.type = 'processing.error';
      errors.push(err);
    })
    .on('error', function(err) {
      console.error('Critical error while fixing line endings:\n' + (err.stack || err));
      if (!conversionEndedAlready) {
        if (errors.length) {
          fs.writeFileSync(path.join(__dirname, 'prepublish.log'), JSON.stringify(errors, null, "  "));
          console.error('There were errors during the dos2unix process. Check "prepublish.log" for more details!');
        }
        console.error('Exiting prematurely...');
        process.exit(1);
      }
    })
    .on('end', function(stats) {
      conversionEndedAlready = true;
      if (errors.length || stats.error > 0) {
        fs.writeFileSync(path.join(__dirname, 'prepublish.log'), JSON.stringify(errors, null, "  "));
        console.error('There were errors during the dos2unix process. Check "prepublish.log" for more details!');
      }
      console.log('dos2unix conversion stats: ' + JSON.stringify(stats));

      // Next!
      finishIt();
    });

  // DEBUGGING
  if (DEBUG_TRAVIS) {
    ['start', 'processing.start', 'processing.skip', 'convert.start', 'convert.end', 'processing.end'].forEach(function(e) {
      dos2unix.on(e, function() {
        var args = [].slice.call(arguments, 0);
        console.log('[DEBUG] dos2unix event: ' + JSON.stringify({ 'type': e, 'args': args }, null, '  '));
      });
    });
  }

  dos2unix.process(['**/*']);
}

function finishIt() {
  if (fs.existsSync(libPath)) {
    rimraf(libPath);
  }
  mkdirp(libPath);

  // Move the contents, if there are files left
  copyR(tmpExtractionsPath, libPath, function(err) {
    // For isolating extraction problems
    if (err) {
      console.error('Temporary files not copied to their final destination!\nError: ' + err);
      process.exit(1);
      return;
    }

    // Verify that files exist in `libPath` now
    fs.readdir(libPath, function(err, files) {
      if (err) {
        console.error('Cannot verify that temporary files were copied to their final destination!\nError: ' + err);
        process.exit(1);
        return;
      }
      if (!files.length) {
        console.error('Temporary files were not copied to their final destination!');
        process.exit(1);
        return;
      }

      // VICTORY!!!
      console.log('SUCCESS! The FlexPMD binaries are available at:\n  ' + libPath);

      if (fs.existsSync(tmpExtractionsPath)) {
        rimrafAsync(tmpExtractionsPath, function(err) {
          if (err) {
            console.log('\nWARNING: Could not delete the temporary directory but that is OK.\n' +
              'The next `npm publish` or `npm install .` should take care of that!\n' +
              'Root cause: ' + err);
          }
        });
      }
    });
  });
}

function extractIt() {
  console.log('Extracting contents from the ZIP...');

  if (fs.existsSync(tmpExtractionsPath)) {
    rimraf(tmpExtractionsPath);
  }
  mkdirp(tmpExtractionsPath);

  try {
    console.log('Exploding ZIP: ' + downloadedFile);
    var zip = new AdmZip(downloadedFile);
    zip.extractAllTo(tmpExtractionsPath, true);

    // Delete the ZIP file - Don't do this anymore as we preferred to leverage existing downloaded copies!
    //fs.unlinkSync(downloadedFile);

    // Next!
    fixLineEndings();
  }
  catch (err) {
    console.error('Died in a nasty ZIP explosion!\n' + err);
    process.exit(1);
  }
}

function fetchIt() {
  // Check if we already have the right ZIP and if it's the correct size
  if (fs.existsSync(downloadedFile)) {
    console.log('It appears that the desired ZIP file is already downloaded.\nVerifying file size...');
    var localFileSize = parseInt(fs.statSync(downloadedFile).size, 10);
    var opts = getOptions();
    opts.method = 'HEAD';
    var req = https.request(opts, function(res) {
      // This might not work if the remote content is served GZIP-ed
      var remoteFileSize = parseInt(res.headers['content-length'] || -1, 10);

      if (localFileSize === remoteFileSize) {
        console.log('Woohoo, the local file size matched the remote file size (both: ' + localFileSize + ')!\nSkipping download.');
        extractIt();  // Next!
      }
      else {
        console.log('Darn, the local file size (' + localFileSize + ') did not match the remote file size (' + remoteFileSize + ').\nProceeding to download...');
        downloadIt();  // Next!
      }
    });
    req.end();
  }
  else {
    downloadIt();  // Next!
  }
}

function downloadIt() {
  var notifiedCount = 0;
  var count = 0;

  // Do NOT do:
  //if (fs.existsSync(tmpDownloadsPath)) {
  //  rimraf(tmpDownloadsPath);
  //}

  mkdirp(tmpDownloadsPath);

  var outFile = fs.openSync(downloadedFile, 'w');

  function onData(data) {
    fs.writeSync(outFile, data, 0, data.length, null);
    count += data.length;
    if ((count - notifiedCount) > 800000) {
      console.log('Received ' + Math.floor(count / 1024) + 'KB...');
      notifiedCount = count;
    }
  }

  function onEnd() {
    console.log('Received ' + Math.floor(count / 1024) + 'KB total!');
    fs.closeSync(outFile);
    extractIt();  // Next!
  }

  function onResponse(response) {
    var status = response.statusCode;
    console.log('Receiving...');

    if (status === 200) {
      response.on('data', onData);
      response.on('end', onEnd);
    }
    else {
      console.log('Error with HTTPS request:\n' + JSON.stringify(response.headers));
      client.abort();
      process.exit(1);
    }
  }

  var client = https.get(getOptions(), onResponse);
  console.log('Requesting ' + downloadUrl);
}

// Go!
fetchIt();
