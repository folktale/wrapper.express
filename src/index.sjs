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

union Component {
  Setting { name: String, value: * },
  Plugin  { path: *, handler: Function },
  Route   { method: String, spec: *, handler: Function }
} deriving (adt.Base, adt.Cata)

union Response {
  Redirect { url: * },
  Send     { status: Number, headers: *, body: Content }
} deriving (adt.Base, adt.Cata)

union Content {
  Buffer { value: * },
  Text   { value: * },
  Value  { value: * }
} deriving (adt.Base, adt.Cata)


// -- Helpers ----------------------------------------------------------

// :: App, Component → App
function configure(app, route) {
  (match route {
    Setting(name, value)         => app.set(name, value),
    Plugin(mountPoint, handler)  => app.use(mountPoint, handler),
    Route(method, spec, handler) => handleRequest(app, method, spec, handler)
  });
  return app
}

// :: App, Method, RouteSpec, (Request → Future[Error, Response]) → App
function handleRequest(app, method, spec, handler) {
  app[method.toLowerCase()](spec, function(req, res) {
    handler(req).fork( handleError(req, res)
                     , sendResponse(req, res)) });
  return app
}

// :: Request, ExpressResponse → Error → Void
function handleError(req, res){ return function(error) {
  console.log(error.toString())
  if (error instanceof Response)  sendResponse(req, res)(error)
  else                            res.send(500, error)
}}

// :: Request, ExpressResponse → Response → Void
function sendResponse(req, res){ return function {
  Redirect(url)               => res.redirect(url),
  Send(status, headers, body) => _send(res, status, headers, body)
}}

// :: Server → Server
function wrapServer(server) {
  return { close: function() { return new Future(function(reject, resolve) {
                    server.close(function(error) {
                                   if (error)  reject(error)
                                   else        resolve() }) })}
         }
}

// :: ExpressResponse, Int, Object, Body → Void
function _send(res, status, headers, body) {
  res.set(headers || {})
  body.cata({
    Text   : function(v){ res.send(status, String(v)) },
    Buffer : function(v){ res.send(status, v) },
    Value  : function(v){ res.send(status, v) }
  })
}

module.exports = function(express) {

  // :: Name → Value → Component
  var set = curry(2, Setting)

  // :: Name → Component
  function enable(name) {
    return Setting(name, true)
  }

  // :: Name → Component
  function disable(name) {
    return Setting(name, false)
  }


  // :: Path → (Request, ExpresResponse, (Any → Void) → Void) → Component
  var plugin = curry(2, Plugin)

  // :: Method → RouteSpec → (Request → Future[Error, Response]) → Component
  var route = curry(3, Route)

  // :: RouteSpec → (Request → Future[Error, Response]) → Component
  var all    = route('all')
  var remove = route('delete')

  // :: ((Request → Future[Error, Response]) → (Request → Future[Error, Response]))
  //  → Component
  //  → Component
  function wrap(wrapper, route) { return match route {
    Route(method, spec, handler) => Route(method, spec, wrapper(handler))
  }}

  // :: Int → App → Future[Error, Server]
  function listen(port, server) { return new Future(function(reject, resolve) {
    var s = server.listen(port, function(error) {
                                  if (error)  reject(error)
                                  else        delayedResolve(this.address()) })

    function delayedResolve(addr) { setTimeout(function() {
      resolve(extend(wrapServer(s), { address: addr })) })}
  })}

  // :: [Component] → Server
  function create(routes) {
    return routes.reduce(configure, express())
  }

  // :: Object → Response
  function json(x) {
    return Send( 200
               , { 'Content-Type': 'application/json' }
               , Value(x))
  }

  // :: String → Content
  function text(a) {
    return Text(a) }

  // :: Any → Content
  function value(a){
    return Value(a) }

  // :: Buffer → Content
  function buffer(a){
    return Buffer(a) }

  // :: Body → Response
  var send     = curry(3, Send);
  var success  = compose(send(200, { 'Content-Type': 'text/html' }), text)
  var notFound = compose(send(404, { 'Content-Type': 'text/html' }), text)
  var fail     = compose(send(500, { 'Content-Type': 'text/html' }), text)

  // :: URL → Response
  var redirect = Redirect


  // -- Exports --------------------------------------------------------
  var exports = { Component : Component
                , Response  : Response
                , Content   : Content
                
                , set       : set
                , enable    : enable
                , disable   : disable
                
                , plugin    : plugin
                
                , route     : route
                , remove    : remove
                , all       : all
                , wrap      : curry(2, wrap)
                
                , listen    : curry(2, listen)
                , create    : create
                
                , send      : send
                , json      : json
                , success   : success
                , notFound  : notFound
                , fail      : fail
                , redirect  : redirect
                
                , text      : text
                , value     : value
                , buffer    : buffer
                }
  methods.forEach(function(m){ exports[m] = route(m) })
  return exports

}
