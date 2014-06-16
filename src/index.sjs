// Copyright (c) 2014 Quildreen Motta
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
 * Monadic wrapper over Express web framework.
 *
 * @module express
 */

// -- Dependencies -----------------------------------------------------
var adt     = require('adt-simple')
var curry   = require('core.lambda').curry
var compose = require('core.lambda').compose
var Future  = require('data.future')
var extend  = require('xtend')
var methods = require('methods')

// -- Data structures --------------------------------------------------

/**
 * Represents a server's configuration.
 *
 * Servers are made up of several components, which are stacked on top
 * of each other in the order they're given. Components that are
 * installed first have precedence, and are executed first whenever
 * a handler for a particular route is called.
 *
 * @class
 * @summary
 * | Setting: { name: String, value: Any }
 * | Plugin:  { path: String, handler: (Request, ExpressRes, (Void → Void) → Void) }
 * | Route:   { method: String, spec: String|RegExp, handler: (Request → Response) }
 */
union Component {
  Setting { name: String, value: * },
  Plugin  { path: String, handler: Function },
  Route   { method: String, spec: *, handler: Function }
} deriving (adt.Base, adt.Cata)

/**
 * Represents the response from a route handler.
 *
 * @class
 * @summary
 * | Redirect: { url: URL }
 * | Send:     { status: Number, headers: Object, body: Content }
 */
union Response {
  Redirect { url: * },
  Send     { status: Number, headers: *, body: Content }
} deriving (adt.Base, adt.Cata)

/**
 * Represents the body of a response.
 *
 * @class
 * @summary
 * | Buffer: { value: Buffer }
 * | Text:   { value: String }
 * | Value:  { value: Any }
 */
union Content {
  Buffer { value: * },
  Text   { value: * },
  Value  { value: * }
} deriving (adt.Base, adt.Cata)


// -- Helpers ----------------------------------------------------------

/**
 * Applies a configuration to an express application.
 *
 * @private
 * @summary App, Component → App
 */
function configure(app, route) {
  (match route {
    Setting(name, value)         => app.set(name, value),
    Plugin(mountPoint, handler)  => app.use(mountPoint, handler),
    Route(method, spec, handler) => handleRequest(app, method, spec, handler)
  });
  return app
}

/**
 * Setups a request handler for a particular route-spec.
 *
 * @private
 * @summary App, Method, RouteSpec, (Request → Future[Error, Repsonse]) → App
 * : where RouteSpec = RegExp | String
 */
function handleRequest(app, method, spec, handler) {
  app[method.toLowerCase()](spec, function(req, res) {
    handler(req).fork( handleError(req, res)
                     , sendResponse(req, res)) });
  return app
}

/**
 * Handles an error while handling the response.
 *
 * @private
 * @summary Request, ExpressResponse → Error | Response → Void
 */
function handleError(req, res){ return function(error) {
  console.log(error.toString())
  if (error instanceof Response)  sendResponse(req, res)(error)
  else                            res.send(500, error)
}}

/**
 * Handles a response from a handler.
 *
 * @private
 * @summary Request, ExpressResponse → Response → Void
 */
function sendResponse(req, res){ return function {
  Redirect(url)               => res.redirect(url),
  Send(status, headers, body) => _send(res, status, headers, body)
}}

/**
 * Sends a response.
 *
 * @private
 * @summary ExpressResponse, Int, Object, Body → Void
 */
function _send(res, status, headers, body) {
  res.set(headers || {})
  body.cata({
    Text   : function(v){ res.send(status, String(v)) },
    Buffer : function(v){ res.send(status, v) },
    Value  : function(v){ res.send(status, v) }
  })
}


/**
 * Returns a wrapper over Node's `Server` objects that provides
 * monadic actions.
 *
 * @private
 * @summary Server → { close: Void → Future[Error, Void] }
 */
function wrapServer(server) {
  return { close: function() { return new Future(function(reject, resolve) {
                    server.close(function(error) {
                                   if (error)  reject(error)
                                   else        resolve() }) })}
         }
}


// -- Public API -------------------------------------------------------
module.exports = function(express) {

  var exports = {}

  /**
   * Constructs a configuration for an Express application.
   *
   * @method
   * @summary Name → Value → Component
   */
  exports.set = curry(2, Setting)

  /**
   * Shor-hand for [`set(name, true)`](#set)
   *
   * @method
   * @summary Name → Component
   */
  exports.enable = enable
  function enable(name) {
    return Setting(name, true)
  }

  /**
   * Shor-hand for [`set(name, false)`](#set)
   *
   * @method
   * @summary Name → Component
   */
  exports.disable = disable
  function disable(name) {
    return Setting(name, false)
  }


  /**
   * Constructs a Plugin configuration for an Express application.
   *
   * @method
   * @summary Path → (Request, ExpressResponse, (Any → Void) → Void) → Component
   */
  exports.plugin = curry(2, Plugin)

  /**
   * Constructs a Route configuration for an Express application.
   *
   * This module also provides short-hands for HTTP verbs supported by Node.js,
   * such that you can conveniently use `VERB(spec, handler)` instead of
   * `route(VERB, spec, handler)`.
   *
   * @method
   * @summary Method → RouteSpec → (Request → Future[Error, Response]) → Component
   */
  var route = exports.route = curry(3, Route)

  /**
   * Short-hand for [`route('all')(...)`](#route).
   *
   * @method
   * @summary RouteSpec → (Request → Future[Error, Response]) → Component
   */
  exports.all = route('all')

  /**
   * Short-hand for [`route('delete')(...)`](#route).
   *
   * @method
   * @summary RouteSpec → (Request → Future[Error, Response]) → Component
   */
  exports.remove = route('delete')

  /**
   * Wraps a route handler.
   *
   * @method
   * @summary
   * ((Request → Future[Error, Response]) → (Request → Future[Error, Response]))
   * → Component
   * → Component
   */
  exports.wrap = curry(2, wrap)
  function wrap(wrapper, route) { return match route {
    Route(method, spec, handler) => Route(method, spec, wrapper(handler))
  }}

  /**
   * Binds an Express server to a particular port.
   *
   * @method
   * @summary Int → App → Future[Error, Server]
   */
  exports.listen = curry(2, listen)
  function listen(port, server) { return new Future(function(reject, resolve) {
    var s = server.listen(port, function(error) {
                                  if (error)  reject(error)
                                  else        delayedResolve(this.address()) })

    function delayedResolve(addr) { setTimeout(function() {
      resolve(extend(wrapServer(s), { address: addr })) })}
  })}

  /**
   * Constructs an Express server from a list of configurations.
   *
   * @method
   * @summary [Component] → Server
   */
  exports.create = create
  function create(routes) {
    return routes.reduce(configure, express())
  }

  /**
   * Constructs a JSON response.
   *
   * @method
   * @summary Object → Response
   */
  exports.json = json
  function json(x) {
    return Send( 200
               , { 'Content-Type': 'application/json' }
               , Value(x))
  }

  /**
   * Constructs a String body for a response.
   *
   * @method
   * @summary String → Content
   */
  exports.text = text
  function text(a) {
    return Text(a) }

  /**
   * Constructs a JS value body for a response.
   *
   * @method
   * @summary Any → Content
   */
  exports.value = value
  function value(a){
    return Value(a) }

  /**
   * Constructs a Buffer body for a response.
   *
   * @method
   * @summary Buffer → Content
   */
  exports.buffer = buffer
  function buffer(a){
    return Buffer(a) }

  /**
   * Constructs a response for a handler.
   *
   * @method
   * @summary Int → Object → Content → Response
   */
  var send = exports.send = curry(3, Send);

  /**
   * Short-hand for [`send(200, { 'Content-Type': 'text/html' }, text(x))`](#send)
   *
   * @method
   * @summary String → Response
   */
  exports.success = compose(send(200, { 'Content-Type': 'text/html' }), text)

  /**
   * Short-hand for [`send(404, { 'Content-Type': 'text/html' }, text(x))`](#send)
   *
   * @method
   * @summary String → Response
   */
  exports.notFound = compose(send(404, { 'Content-Type': 'text/html' }), text)

  /**
   * Short-hand for [`send(500, { 'Content-Type': 'text/html' }, text(x))`](#send)
   *
   * @method
   * @summary String → Response
   */
  exports.fail = compose(send(500, { 'Content-Type': 'text/html' }), text)

  /**
   * Constructs a redirect response for a handler.
   *
   * @method
   * @summary URL → Response
   */
  exports.redirect = Redirect


  // -- Exports --------------------------------------------------------
  exports.Component = Component
  exports.Response  = Response
  exports.Content   = Content

  methods.forEach(function(m){ exports[m] = route(m) })

  return exports

}
