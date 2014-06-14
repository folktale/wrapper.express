macro $routes {
  rule { $scope:expr { $a ... } } => {
    [ defroutes $scope { $a ... } ];
  }
}

// Known HTTP methods
macro method {
  rule { get }    => { "get" }
  rule { post }   => { "post" }
  rule { put }    => { "put" }
  rule { remove } => { "remove" }
  rule { all }    => { "all" }
}

// Define routes
macro defroutes {
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
  rule { $param:ident => $result:expr } => {
    function($param){ return $result }
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
    ++$i;
    var $id = $i in $obj? $obj[i] : $init;
    bind $obj $i [ $p ... ]
  }

  rule { $obj $i [ ] } => { }

  rule { $obj { } } => { }
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
