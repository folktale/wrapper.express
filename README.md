wrapper.express
===============

[![Build Status](https://secure.travis-ci.org/folktale/wrapper.express.png?branch=master)](https://travis-ci.org/folktale/wrapper.express)
[![NPM version](https://badge.fury.io/js/wrapper.express.png)](http://badge.fury.io/js/wrapper.express)
[![Dependencies Status](https://david-dm.org/folktale/wrapper.express.png)](https://david-dm.org/folktale/wrapper.express)
[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges)


Monadic wrapper over Express web framework.


## Example

```js
( ... )
```


## Installing

The easiest way is to grab it from NPM. If you're running in a Browser
environment, you can use [Browserify][]

    $ npm install wrapper.express


### Using with CommonJS

If you're not using NPM, [Download the latest release][release], and require
the `wrapper.express.umd.js` file:

```js
var express = require('wrapper.express')
```


### Using with AMD

[Download the latest release][release], and require the `wrapper.express.umd.js`
file:

```js
require(['wrapper.express'], function(express) {
  ( ... )
})
```


### Using without modules

[Download the latest release][release], and load the `wrapper.express.umd.js`
file. The properties are exposed in the global `folktale.wrapper.express` object:

```html
<script src="/path/to/wrapper.express.umd.js"></script>
```


### Compiling from source

If you want to compile this library from the source, you'll need [Git][],
[Make][], [Node.js][], and run the following commands:

    $ git clone git://github.com/folktale/wrapper.express.git
    $ cd wrapper.express
    $ npm install
    $ make bundle
    
This will generate the `dist/wrapper.express.umd.js` file, which you can load in
any JavaScript environment.

    
## Documentation

You can [read the documentation online][docs] or build it yourself:

    $ git clone git://github.com/folktale/wrapper.express.git
    $ cd wrapper.express
    $ npm install
    $ make documentation

Then open the file `docs/index.html` in your browser.


## Platform support

This library assumes an ES5 environment, but can be easily supported in ES3
platforms by the use of shims. Just include [es5-shim][] :)


## Licence

Copyright (c) 2014 Quildreen Motta.

Released under the [MIT licence](https://github.com/folktale/wrapper.express/blob/master/LICENCE).

<!-- links -->
[Fantasy Land]: https://github.com/fantasyland/fantasy-land
[Browserify]: http://browserify.org/
[Git]: http://git-scm.com/
[Make]: http://www.gnu.org/software/make/
[Node.js]: http://nodejs.org/
[es5-shim]: https://github.com/kriskowal/es5-shim
[docs]: http://folktale.github.io/wrapper.express
<!-- [release: https://github.com/folktale/wrapper.express/releases/download/v$VERSION/wrapper.express-$VERSION.tar.gz] -->
[release]: https://github.com/folktale/wrapper.express/releases/download/v0.0.0/wrapper.express-0.0.0.tar.gz
<!-- [/release] -->
