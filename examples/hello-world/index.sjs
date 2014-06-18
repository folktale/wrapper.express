// Let's start with the simplest example: the Hello World.

// First, we'll need to load some modules we depend on. The
// `wrapper.express` module is a function that takes in an Express
// module and returns a wrapper for that Express module.
// This allows one to have their code work with different versions
// of the `express` library, rather than be tied to a specific one.
var Express = require('wrapper.express')(require('express'))

// For representing the asynchronous actions, the library uses
// the `Future` monad, so we'll also need to load it.
var Future = require('data.future')

// Finally, we create some aliases for things we'd probably end
// up using too often, so they're easier to read.
var success  = Express.success
var redirect = Express.redirect


// With the dependencies part taken care of, we can proceed to the
// configuration part. Here's where we'll define the routes for
// our webserver, and how each one of them will get handled.
//
// This webserver will have two routes:
var routes = $routes(Express) {
  // A `GET /` route will just redirect the user to `/World`
  get('/'): req =>
    Future.of(redirect('/World'))

  // A `GET /:SOMETHING` route will output the text `Hello, SOMETHING`
  get('/:name'): {params: { name }} =>
    Future.of(success('Hello, ' + name + '!'))
}


// Finally, we take our routing definitions and create an Express
// application by assembling all the components:
var app = Express.create(routes)

// And we run this application by binding it to a specific port:
Express.listen(8080, app).fork(
  function(error) { throw error }
, function(server){ console.log('Server started on port: ' + server.address.port) }
)
