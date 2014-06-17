macro $routes {
  rule { $scope:expr { $a ... } } => {
    [ defroutes $scope { $a ... } ]
  }
}

// Known HTTP methods
macro method {
  rule { get }    => { "get" }
  rule { post }   => { "post" }
  rule { put }    => { "put" }
  rule { delete } => { "delete" }
  rule { all }    => { "all" }
}

// Define routes
macro defroutes {
  rule { $scope { set $key = $value } } => {
    $scope.set($key, $value)
  }
  rule { $scope { set $key = $value $a ... } } => {
    $scope.set($key, $value),
    defroutes $scope { $a ... }
  }

  rule { $scope { plugin ( $mount ): $handler } } => {
    $scope.plugin($mount, $handler)
  }
  rule { $scope { plugin ( $mount ): $handler $a ... } } => {
    $scope.plugin($mount, $handler),
    defroutes $scope { $a ... }
  }

  rule { $scope { engine ( $ext ): $handler } } => {
    $scope.engine($ext, $handler)
  }
  rule { $scope { engine ( $ext ): $handler $a ... } } => {
    $scope.engine($ext, $handler),
    defroutes $scope { $a ... }
  }

  rule { $scope { $m:method ( $url ): $f:routefn } } => {
    $scope[$m]($url, $f)
  }
  rule { $scope { $m:method ( $url ): $f:routefn $a ... } } => {
    $scope[$m]($url, $f),
    defroutes $scope { $a ... }
  }

  rule { $scope } => { }
}

// Destructuring sugar for route handlers
macro routefn {
  rule { $param:ident => $result:fbody } => {
    function($param){ $result }
  }

  rule { $param:ident : { $p ... } => $result:fbody } => {
    function($param) {
      bind $param { $p ... , }
      $result
    }
  }

  rule { { $p ... } => $result } => {
    routefn request:{ $p ... } => $result
  }
}

macro fbody {
  rule { { $a ... } } => {
    $a ...
  }

  rule { $result:expr } => { 
    return $result;
  }
}

macro bind {
  rule { $obj { $id:ident , $a ... } } => {
    var $id = $obj[$toString $id];
    bind $obj { $a ... }
  }

  rule { $obj { $id:ident : $nid:ident , $a ... } } => {
    var $nid = $obj[$toString $id];
    bind $obj { $a ... }
  }

  rule { $obj { $id:ident : { $p ... } , $a ... } } => {
    bind ($obj[$toString $id]) { $p ... , }
    bind $obj { $a ... }
  }

  rule { $obj { $id:ident : [ $p ... ] , $a ... } } => {
    var i = 0;
    bind ($obj[$toString $id]) i [ $p ... , ]
    bind $obj { $a ... }
  }

  rule { $obj $i [ $id:ident , $p ... ] } => {
    var $id = $obj[$i++];
    bind $obj $i [ $p ... ]
  }

  rule { $obj $i [ $id:ident = $init:expr , $p ... ] } => {
    var $id = $i in $obj? $obj[$i] : $init;
    ++$i;
    bind $obj $i [ $p ... ]
  }

  rule { $obj $i [ $[...] $id:ident , ] } => {
    var $id = $obj.slice($i);
  }

  rule { $obj $i [ ] } => { }
  rule { $obj $i [ , ] } => { }
  rule { $obj { } } => { }
  rule { $obj { , } } => { }
}


// -- Helpers ----------------------------------------------------------
macro $toString {
  case { _ $a } => {
    var val = #{$a}[0].token.value;
    var stx = makeValue(val, #{here});
    return withSyntax ($val = [stx]) {
      return #{$val}
    }
  }
}

export $routes;
