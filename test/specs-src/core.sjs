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

var _        = require('../../')(require('express'))
var http     = require('net.http-client')
var Future   = require('data.future')
var $        = require('alright')
var sequence = require('control.monads').sequence
var URI      = require('net.uri').URI

function unary(f){ return function(a) { return f(a) }}

var methods = ["checkout","copy","delete","get","head","lock"
              ,"m-search","merge","mkactivity","mkcol","move"
              ,"notify","options","patch","post","propfind"
              ,"proppatch","purge","put","report","search"
              ,"subscribe","trace","unlock","unsubscribe"]

var headers = { 'Content-Type': 'text/html' }

module.exports = spec 'Core' {
  spec 'Settings' {
    it 'Setting(a, b) should configure the key a to value b' {
      var app = _.create([_.Component.Setting('a', [1, 2])]);
      app.get('a') => [1, 2]
    }

    it '.set(a, b) should work the same way' {
      var app = _.create([_.set('a', [1, 2])]);
      app.get('a') => [1, 2]
    }

    it '.enable(a) should be the same as Setting(a, true)' {
      var app = _.create([_.enable('a')]);
      app.get('a') => true
    }

    it '.disable(a) should be the same as Setting(a, false)' {
      var app = _.create([_.disable('a')]);
      app.get('a') => false
    }
  }

  spec 'Plugin' {
    async 'Should define a middleware in the given mountpoint in the right order' {
      var xs  = []
      var app = _.create([
        _.plugin('/', function(req, res, next) { xs.push(1); next() }),
        _.plugin('/foo', function(req, res, next) { xs.push(2); next() }),
        _.get('/*', function(){ return Future.of(_.success('')) }),
      ]);

      return $do {
        server <- _.listen(8081, app)
        http.get({}, 'http://localhost:8081')
        Future.of(xs) will $.equal([1])
        http.get({}, 'http://localhost:8081/foo')
        Future.of(xs) will $.equal([1, 1, 2])
        server.close()
        return null
      }
    }
  }

  spec 'Routing' {
    async 'Route(M,U,H) should define a new route for method M, url U' {
      var app = _.create([
        _.route('GET', '/a', function(){ return Future.of(_.success('a')) }),
        _.route('get', '/b', function(){ return Future.of(_.success('b')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081/a')
        Future.of(x.body) will $.equal('a')
        y <- http.get({}, 'http://localhost:8081/b')
        Future.of(y.body) will $.equal('b')
        server.close()
        return null
      }
    }

    async 'all(U, H) should define a route for any method' {
      var xs = []
      var app = _.create([
        _.all('/', function(req){ xs = req.method; return Future.of(_.success('')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        sequence(Future, methods.map(check))
        server.close()
        return null
      }

      function check(m) { return $do {
        http(m, {}, 'http://localhost:8081')
        Future.of(xs.toLowerCase()) will $.equal(m)
        return null
      }}
    }

    async 'Should define a route function for every method' {
      var xs = []
      var f  = function(req){ xs = req.method; return Future.of(_.success('')) }
      var app = _.create(methods.map(function(m){ return _[m]('/', f) }))

      return $do {
        server <- _.listen(8081, app)
        sequence(Future, methods.map(check))
        server.close()
        return null
      }

      function check(m) { return $do {
        http(m, {}, 'http://localhost:8081')
        Future.of(xs.toLowerCase()) will $.equal(m)
        return null
      }}
    }

    async '`remove` should be an alias for `delete`' { 
      var app = _.create([
        _.remove('/', function(){ return Future.of(_.success('a')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http('delete', {}, 'http://localhost:8081')
        Future.of(x.body) will $.equal('a')
        server.close()
        return null
      }
    }

    async 'wrap(w,r) should wrap the route' {
      var x = []
      var app = _.create([
        _.get('/', function(){ return Future.of(_.success('a')) })
      ].map(unary(_.wrap(function(h) { return function(req) {
        x = 'wrapped';
        return h(req)
      }}))))

      return $do {
        server <- _.listen(8081, app)
        http.get({}, 'http://localhost:8081')
        Future.of(x) will $.equal('wrapped')
        server.close()
        return null
      }
    }
  }

  spec 'Responses' {
    async 'json(x) should send a JSON response.' {
      var app = _.create([
        _.get('/', function(){ return Future.of(_.json({ a: 1 })) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(JSON.parse(x.body)) will $.equal({ a: 1 })
        server.close()
        return null
      }
    }

    async 'success(x) should send a 200 response.' {
      var app = _.create([
        _.get('/', function(){ return Future.of(_.success('')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.response.status) will $.equal(200)
        server.close()
        return null
      }
    }

    async 'notFound(x) should send a 404 response.' {
      var app = _.create([
        _.get('/', function(){ return Future.of(_.notFound('')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.response.status) will $.equal(404)
        server.close()
        return null
      }
    }

    async 'fail(x) should send a 500 response.' {
      var app = _.create([
        _.get('/', function(){ return Future.of(_.fail('')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.response.status) will $.equal(500)
        server.close()
        return null
      }
    }

    async 'redirect(u) should redirect to the url.' {
      var url = URI.fromString('/other')
      var app = _.create([
        _.get('/', function(){ return Future.of(_.redirect('/other')) }),
        _.get('/one', function(){ return Future.of(_.redirect(url)) }),
        _.get('/other', function(){ return Future.of(_.success('boo')) })
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.body) will $.equal('boo')
        y <- http.get({}, 'http://localhost:8081/one')
        Future.of(y.body) will $.equal('boo')
        server.close()
        return null
      }
    }

    async 'text(a) should enforce a text response.' {
      var o = { toString: function(){ return 'boo' }}
      var app = _.create([
        _.get('/', λ[Future.of(_.send(200, headers, _.text(o)))])
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.body) will $.equal('boo')
        server.close()
        return null
      }
    }

    async 'value(a) should send a JSON response' {
      var o = { toString: function(){ return 'boo' }, a: 1 }
      var app = _.create([
        _.get('/', λ[Future.of(_.send(200, headers, _.value(o)))])
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(JSON.parse(x.body)) will $.equal({ a: 1 })
        server.close()
        return null
      }
    }

    async 'buffer(a) should send a buffer as response' {
      var Buffer = require('buffer').Buffer
      var buf = new Buffer('foo')
      var app = _.create([
        _.get('/', λ[Future.of(_.send(200, headers, _.buffer(buf)))])
      ])

      return $do {
        server <- _.listen(8081, app)
        x <- http.get({}, 'http://localhost:8081')
        Future.of(x.body) will $.equal('foo')
        server.close()
        return null
      }
    }

  }
}
