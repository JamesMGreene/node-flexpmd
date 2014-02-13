# flexpmd [![Build Status](https://secure.travis-ci.org/JamesMGreene/node-flexpmd.png?branch=master)](http://travis-ci.org/JamesMGreene/node-flexpmd)

A Node.js module to download and "install" the FlexPMD infrastructure for linting/analyzing ActionScript/Flash/Flex/AIR code.


## Getting Started
Install the module with: `npm install flexpmd`

```javascript
var flexlint = require('flexpmd');
console.log(flexlint.path);  // path to the main directory of JARs
console.log(flexlint.cmd);   // path to the JAR to use like a command line executable
```


## External Dependencies
While this Node/NPM module does not have any external dependencies itself, the FlexPMD tool requires Java.


## Examples
See the unit tests for example usage.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History
- 1.3.0: Published to NPM on 2014-02-17.
    - Initial release. Version number aligned with FlexPMD version number.


## License
Copyright (c) 2014 James M. Greene  
Licensed under the MIT license.


## Background Information on FlexPMD
 - [Home](http://sourceforge.net/adobe/flexpmd/)
 - [Overview](http://sourceforge.net/adobe/flexpmd/wiki/Overview/)
 - [About](http://sourceforge.net/adobe/flexpmd/wiki/About/)
 - [How to invoke FlexPMD](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20invoke%20FlexPMD/)
 - [How to interpret FlexPMD results](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20interpret%20results/)
 - [How to add your own rule](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20add%20your%20own%20rule/)
 - [Developer documentation](http://sourceforge.net/adobe/flexpmd/wiki/Developer%20documentation/)
 - [Mind Map: "What is FlexPMD?"](http://www.xmind.net/m/F2Ft/)
 - [FlashDevelop4's integrated FlexPMD source folder](http://flashdevelop.googlecode.com/svn/trunk/FD4/FlashDevelop/Bin/Debug/Tools/flexpmd/) _(&rarr; Tools &rarr; Flash Tools &rarr; Analyse Project Source code.)_
 - [FlashDevelop3's FlexPMD plugin wrapper and usage discussion](http://www.flashdevelop.org/community/viewtopic.php?f=4&t=5403)
 - [FlashDevelop3's FlexPMD plugin wrapper setup guide](http://www.swfgeek.net/2009/09/18/using-flex-pmd-in-flashdevelop-3/)
