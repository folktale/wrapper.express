// This is an example of how you can use express plugins with the
// wrapper library. To do so, this example will use the `static` plugin,
// which serves static files from a directory.

// To begin, we'll load some of the modules this server depends
// on.
var _static = require('express').static
var Express = require('wrapper.express')(require('express'))
var Future  = require('data.future')
var Maybe   = require('data.maybe')

// Then we'll construct the components that define the plugins.
var specs = $routes(Express) {
  // The wrapper always requires the mount-point of a plugin to be
  // defined.

  // `plugin('/'): f` is the same as express's `app.use(f)`, so if you
  // need a plugin to be defined for all routes (as is the case here),
  // just bind it to the root URL.
  plugin('/'): _static(__dirname + '/public')

  // Plugins are assembled in the order they appear in the component list,
  // and plugins that are defined first have a higher precedence (they're
  // tried first).
}

// Lastly, we assemble the Express application and bind it to a
// particular port.
Express.listen(Maybe.of(8080), Express.create(specs)).fork(
  function(error) { throw error }
, function(server){ console.log('Server started on port: ' + server.address.port) }
)
