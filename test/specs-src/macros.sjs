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
var Future   = require('data.future')
var http     = require('net.http-client')
var sequence = require('control.monads').sequence
var $        = require('alright')

var methods = ["checkout","copy","delete","get","head","lock"
              ,"m-search","merge","mkactivity","mkcol","move"
              ,"notify","options","patch","post","propfind"
              ,"proppatch","purge","put","report","search"
              ,"subscribe","trace","unlock","unsubscribe"]

function check(m, r) {
  return $do {
    x <- http(m, {}, 'http://localhost:8081')
    Future.of(x.body) will $.equal(r)
    return null
  }
}


module.exports = spec 'Macros' {
  spec 'Methods' {
    async 'get' {
      var app = $routes(_) {
        get('/'): req => Future.of(_.success('a'))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        check('get', 'a')
        server.close()
        return null
      }
    }

    async 'post' {
      var app = $routes(_) {
        post('/'): req => Future.of(_.success('a'))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        check('post', 'a')
        server.close()
        return null
      }
    }

    async 'put' {
      var app = $routes(_) {
        put('/'): req => Future.of(_.success('a'))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        check('put', 'a')
        server.close()
        return null
      }
    }

    async 'delete' {
      var app = $routes(_) {
        delete('/'): req => Future.of(_.success('a'))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        check('delete', 'a')
        server.close()
        return null
      }
    }

    async 'all' {
      var app = $routes(_) {
        all('/'): req => Future.of(_.success(''))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        sequence(Future, methods.map(λ(x) -> check(x, '')))
        server.close()
        return null
      }
    }

    async 'mixed routes' {
      var app = $routes(_) {
        get('/'): req => Future.of(_.success('a'))
        post('/'): req => Future.of(_.success('a'))
        put('/'): req => Future.of(_.success('a'))
      };

      return $do {
        server <- _.listen(8081, _.create(app))
        check('get', 'a') check('post', 'a') check('put', 'a')
        server.close()
        return null
      }

    }
  }

  spec 'Function types' {
    it 'As expression' {
      var app = $routes(_) {
        get('/'): req => req
      };

      app[0].handler(1) => 1
    }

    it 'As block' {
      var app = $routes(_) {
        get('/'): req => { return req }
      };

      app[0].handler(1) => 1
    }

    it 'Destructuring expression' {
      var app = $routes(_) {
        get('/'): req:{a} => 1
      };

      app[0].handler({}) => 1
    }

    it 'Destructuring block' {
      var app = $routes(_) {
        get('/'): req:{a} => { return 1 }
      };

      app[0].handler({}) => 1
    }

    it 'Allows manipulating the routes' {
      $routes(_){ get('/'): req => 1 }[0].handler() => 1
    }
  }

  spec 'Destructuring' {
    it 'With an alias for request parameter' {
      var app = $routes(_){ get('/'): req:{} => req };

      app[0].handler({a:1}) => {a:1}
    }

    it 'Without an alias for request parameter' {
      var app = $routes(_){ get('/'): {a} => a };

      app[0].handler({a:1}) => 1
    }

    it 'Object destructuring' {
      var app = $routes(_){ get('/'): {a,b,c} => a + b + c };
      app[0].handler({a:1,b:2,c:3}) => 1+2+3
    }

    it 'Renaming' {
      var app = $routes(_){ get('/'): {a:x,b:y,c:z} => x + y + z };
      app[0].handler({a:1,b:2,c:3}) => 1+2+3
    }

    it 'Deep destructuring' {
      var app = $routes(_){ get('/'): {a,b:{x},c} => a + x + c };
      app[0].handler({a:1,b:{x:2,y:3},c:3}) => 1+2+3
    }

    it 'Array destructuring' {
      var app = $routes(_){ get('/'): {a:[b,c],d} => b + c + d };
      app[0].handler({a:[1,2,3], d:3}) => 1+2+3
    }

    it 'Array destructuring with defaults' {
      var app = $routes(_){ get('/'): {a:[b,c,d=1,e=2]} => b + c + d + e };
      app[0].handler({a:[1,2,3]}) => 1+2+3+2
    }

    it 'Array destructuring with ellipsis' {
      var app = $routes(_){ get('/'): { a:[b, ...c] } => [b,c] };
      app[0].handler({a:[1,2,3]}) => [1, [2, 3]]
    }

    it 'Empty patterns' {
      var app = $routes(_){ get('/'): req:{a:{}, b:[]} => req };
      app[0].handler({x:1}) => { x: 1 }
    }
  }

  spec 'Other components' {
    it 'Setting' {
      var app = $routes(_){ set 'foo' = 'bar' set 'baz' = 1 };
      app[0].name => 'foo';
      app[0].value => 'bar';
      app[1].name => 'baz';
      app[1].value => 1;
    }

    it 'Plugin' {
      function f(){};
      var app = $routes(_){ plugin('/'): f };
      app[0].path => '/';
      app[0].handler => f;
    }

    it 'Engine' {
      function f(){};
      var app = $routes(_){ engine('a'): f };
      app[0].extension => 'a';
      app[0].engine => f;
    }
  }

}
