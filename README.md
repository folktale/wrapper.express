wrapper.express
===============

[![Build Status](https://secure.travis-ci.org/folktale/wrapper.express.png?branch=master)](https://travis-ci.org/folktale/wrapper.express)
[![NPM version](https://badge.fury.io/js/wrapper.express.png)](http://badge.fury.io/js/wrapper.express)
[![Dependencies Status](https://david-dm.org/folktale/wrapper.express.png)](https://david-dm.org/folktale/wrapper.express)
[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges)


Monadic wrapper over Express web framework.


## Example

```js
var Future  = require('data.future')
var Express = require('wrapper.express')(require('express'))

var routes = [
  Express.get('/:name', function(req) {
    return new Future(function(reject, resolve) {
      resolve(Express.send('Hello, ' + req.params.name))
    })
  })
]

var app = Express.create(routes)

Express.listen(8080, app).fork(
  function (error){ throw error }
, function (addr) { console.log('Running on http://localhost:' + addr.port) }
)
```

Or with Sweet.js macros:

```js
var Express = require('wrapper.express')(require('express'));

var routes = $routes(Express) {
  get('/:name'): {params:{ name }} => $do {
    html <- Future.of('Hello, ' + name)
    return Express.send(html)
  }
}
```


## Installing

The easiest way is to grab it from NPM. If you're running in a Browser
environment, you can use [Browserify][]

    $ npm install wrapper.express

    
## Documentation

Check out the [Wiki][wiki] for detailed information about the library. There's
also plenty of [Examples][examples] in the `examples/` folder.

You can [read the API documentation online][docs] or build it yourself:

    $ git clone git://github.com/folktale/wrapper.express.git
    $ cd wrapper.express
    $ npm install
    $ make documentation

Then open the file `docs/index.html` in your browser.


## Platform

This library requires `express@4.x` and `node@0.10+`.

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
[wiki]: https://github.com/folktale/wrapper.express/wiki
[examples]: https://github.com/folktale/wrapper.express/tree/master/examples
<!-- [release: https://github.com/folktale/wrapper.express/releases/download/v$VERSION/wrapper.express-$VERSION.tar.gz] -->
[release]: https://github.com/folktale/wrapper.express/releases/download/v0.2.0/wrapper.express-0.2.0.tar.gz
<!-- [/release] -->
