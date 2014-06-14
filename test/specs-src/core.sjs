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

var _ = require('../../')(require('express'))

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
}
