// Copyright (c) 2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * A simple web service.
 *
 * @module examples/webservice
 */

// -- Dependencies -----------------------------------------------------
var Express = require('wrapper.express')(require('express'))
var Future  = require('data.future')
var compose = require('core.lambda').compose

var success  = compose(Express.send(200, {}), Express.value)
var fail     = compose(Express.send(500, {}), Express.value)


// -- Helpers ----------------------------------------------------------
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

function error(status, message) {
  return Express.send(status, {}, Express.value({ error: message }))
}

function checkApiKey(handle) { return function(request) {
  var key = request.query['api-key']

  return (!key)?           Future.of(error(400, "api-key is required."))
  :      (!isValid(key))?  Future.of(error(401, "invalid api key."))
  :      /* otherwise */   handle(request)
}}

function unary(f){ return function(a) {
  return f(a)
}}


// -- Configuration ----------------------------------------------------

// These are the authenticated routes for the API.
var api_routes = $routes(Express) {
  get('/api/users'): req =>
    Future.of(success(users))

  get('/api/user/:name/likes'): { params: {name} } =>
      name in likes?   Future.of(success(likes[name]))
    : /* Otherwise */  Future.of(error(404, "Oh, my! I can't find it!"))

// We need to validate the API key for these routes, so we do it by
// wrapping every handler:
}.map(unary(Express.wrap(checkApiKey)))

// These are the routes that should get called if nothing else works,
// as such, they should be placed last in the list of routes.
var fallback_routes = $routes(Express) {
  all('/*'): req =>
    Future.of(error(404, "No such thing."))
}

// All routes for this application
var routes = api_routes.concat(fallback_routes)


// -- Running ----------------------------------------------------------
Express.listen(8080, Express.create(routes)).fork(
  function(error) { throw error }
, function(server){ console.log('Server started on port: ' + server.address.port) }
)

  
