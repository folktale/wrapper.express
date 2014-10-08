// This example will show how to write a simple webservice using the
// wrapper library. This example provides a simple JSON-based API with a
// few authenticated endpoints.

// As always, we need to first load the modules we depend on.
var Express = require('wrapper.express')(require('express'))
var Future  = require('data.future')
var Maybe   = require('data.maybe')
var compose = require('core.lambda').compose

// The wrapper library provides some convenience methods for sending
// responses, but they assume that the content will be a String
// containing HTML (which is the common case). Fortunately it's easy
// enough to create your own convenience functions by way of partial
// application and function composition.
var success  = compose(Express.send(200, {}), Express.value)
var fail     = compose(Express.send(500, {}), Express.value)

function error(status, message) {
  return Express.send(status, {}, Express.value({ error: message }))
}



// Below we define some of the data that our webservice will work with,
// in a real application this would probably come from a database or
// something.
var api_keys = ['red-queen', 'white-rabbit']

var users = [ { name: 'alice' }
            , { name: 'mad-hatter' }
            ]

var likes = { alice        : ['curious things', 'cats']
            , 'mad-hatter' : ['tea']
            }

function isValid(key) {
  return api_keys.indexOf(key) != -1
}


// Now we can configure the routes that our webservice will respond to.
var api_routes = $routes(Express) {
  // For `GET /api/users` we'll have it return all users in the database.
  get('/api/users'): req =>
    Future.of(success(users))

  // And for `GET /api/user/:name/likes` we'll have it either return the
  // things that user likes, or a 404 error (properly formated as a JSON
  // response).
  get('/api/user/:name/likes'): { params: {name} } =>
      name in likes?   Future.of(success(likes[name]))
    : /* Otherwise */  Future.of(error(404, "Oh, my! I can't find it!"))

// But these routes are not accessible for everyone, they require the
// user to be authenticated in order to access the resources. To do so,
// we just wrap every route in the API and do some checks before
// proceeding.
}.map(function(route) {
  return Express.wrap(checkApiKey, route)
})

// The wrapper function is just something that takes in a handler, and
// returns a new route handler. This one will verify if a key was
// provided, and if it is a valid key, before calling the original
// handler to serve the resource.
function checkApiKey(handle) { return function(request) {
  var key = request.query['api-key']

  return (!key)?           Future.of(error(400, "api-key is required."))
  :      (!isValid(key))?  Future.of(error(401, "invalid api key."))
  :      /* otherwise */   handle(request)
}}

// We also want to send a 404 response properly formatted as JSON
// whenever the user access an endpoint that our service doesn't know
// about, since Express' default response isn't.
//
// We can either drop down to Express' plugins, or define a "catch-all"
// route, so here we'll do the latter (see the express' examples to see
// how to use plugins for this).
var fallback_routes = $routes(Express) {
  all('/*'): req =>
    Future.of(error(404, "No such thing."))
}

// We then combine all of the components for this webserver in order to
// create an express application, making sure our catch-all route has
// the least precedence (comes last), as we want to try all defined
// routes first.
var routes = api_routes.concat(fallback_routes)
var app    = Express.create(routes)


// Finally, we bind the application to a port and run it.
Express.listen(Maybe.of(8080), app).fork(
  function(error) { throw error }
, function(server){ console.log('Server started on port: ' + server.address.port) }
)
