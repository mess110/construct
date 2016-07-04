var app = angular.module('app', ['ngAnimate', 'ngRoute', 'ui.bootstrap', 'uiSwitch']);

var commandsPerPlayer = 5;

isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

guid = function() {
  var s4;
  return s4 = function() {
    return Math.floor(65536 * (1 + Math.random())).toString(16).substring(1);
  }, s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

Array.prototype.shuffle = function() {
  var array, i, m, t;
  for (array = this, m = array.length, t = void 0, i = void 0; m; ) i = Math.floor(Math.random() * m--);
  t = array[m], array[m] = array[i], array[i] = t;
  return array;
}

function shuffle(a) {
  var j, x, i;
  for (i = a.length; i; i -= 1) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
  return a;
}

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl : 'landing.html',
    controller  : 'LandingController'
  })
  .when('/games', {
    templateUrl : 'games.html',
    controller  : 'GamesController'
  })
  .when('/lobby/:id', {
    templateUrl : 'lobby.html',
    controller  : 'LobbyController'
  })
  .when('/cleanup', {
    templateUrl : 'cleanup.html',
    controller  : 'CleanupController'
  })
  .when('/games/:id', {
    templateUrl : 'game.html',
    controller  : 'GameController'
  })
  .otherwise({redirectTo: '/'});
});

app.controller('MainController', function ($scope, $location) {
  var key = Persist.get('ownId');
  if (key == null || key == undefined) {
    $scope.ownId = guid();
    Persist.set('ownId', $scope.ownId);
  } else {
    $scope.ownId = key;
  }

  console.log($scope.ownId);

  var options = {
    api_key: 'teambuilder',
  secret: 'teambuilder',
  version: 4
  };
  $scope.api = new Api(options);

  $scope.goTo = function (url) {
    $location.path(url);
  }

  $scope.game = {};
});
app.controller('LandingController', function ($scope) {
  $scope.newGame = function () {
    $scope.api.createGame($scope.ownId, function (game) {
      $scope.api.joinGame($scope.ownId, game.id, function (join) {
        $scope.goTo('/lobby/' + join.gameId);
        $scope.$apply();
      })
    })
  }
});
app.controller('LobbyController', function ($scope, $routeParams, $interval) {
  $scope.startGame = function () {
    $scope.game.status = 'play';
    $scope.game.start_time = Date.now();

    $scope.game.players = [];
    for (var i = 0, l = $scope.players.length; i < l; i++) {
      var v = $scope.players[i];
      $scope.game.players.push(v.ownId);
    }

    $scope.gameMaker = new GameMaker({ size: $scope.game.players.length });
    $scope.game.maker = $scope.gameMaker.toJson();

    $scope.api.updateGame($scope.game, function (game) {
      $interval.cancel($scope.playersPromise);
      $interval.cancel($scope.gamePromise);
      $scope.goTo('/games/' + $routeParams.id);
      $scope.$apply();
    })
  }

  $scope.refreshPlayers = function () {
    $scope.api.getPlayers($routeParams.id, function (players) {
      $scope.players = players;
      $scope.$apply();
    })
  }

  $scope.getGame = function () {
    $scope.api.getGame($routeParams.id, function (game) {
      $scope.game = game[0];
      $scope.ownGame = $scope.game.ownerId == $scope.ownId;
      // TODO: check if game not found
      if ($scope.game.status == 'play') {
        $interval.cancel($scope.playersPromise);
        $interval.cancel($scope.gamePromise);
        $scope.goTo('/games/' + $routeParams.id);
      }
      $scope.$apply();
    });
  }

  $scope.ownGame = false;

  $scope.refreshPlayers();
  $scope.playersPromise = $interval($scope.refreshPlayers, 1000);

  $scope.getGame();
  $scope.gamePromise = $interval($scope.getGame, 1000);
});
app.controller('GamesController', function ($scope) {
  $scope.api.getGames(function (data) {
    $scope.games = data;
    $scope.$apply();
  });

  $scope.joinGame = function (game) {
    $scope.api.joinGame($scope.ownId, game.id, function (join) {
      $scope.goTo('/lobby/' + join.gameId);
      $scope.$apply();
    })
  };
});

app.controller('CleanupController', function ($scope, $routeParams, $interval) {
  $scope.api.getGames(function (games) {
    for (var i = 0, l = games.length; i < l; i++) {
      var v = games[i];
      if ((Date.now() / 1000) - v.created_at > 3600) {
        v.status = 'finished';
        $scope.api.updateGame(v, function (game) {
          console.log(game);
        });
      }
    }
  });
})

app.controller('GameController', function ($scope, $routeParams, $interval) {
  $scope.uiCols = [];
  $scope.doneActions = [];

  $scope.api.getGame($routeParams.id, function (game) {
    $scope.game = game[0];
    $scope.ownIndex = $scope.game.players.indexOf($scope.ownId);
    console.log($scope.game);

    $scope.uiCols = shuffle([
      $scope.game.maker.buttons[$scope.ownIndex],
      $scope.game.maker.radios[$scope.ownIndex],
      $scope.game.maker.switches[$scope.ownIndex],
      $scope.game.maker.ratings[$scope.ownIndex]
    ]);
    $scope.yourCommands = $scope.game.maker.commands.splice($scope.ownIndex * commandsPerPlayer, commandsPerPlayer);
    $scope.$apply();
  });

  $scope.click = function (col) {
    var action = {
      target: col,
      ownId: $scope.ownId,
      gameId: $routeParams.id
    };
    $scope.api.click(action, function (data) {
      $scope.$apply();
    });
  }

  $scope.getActions = function () {
    $scope.api.getScore($routeParams.id, function (tmpScore) {
      $scope.totalScore = tmpScore;
      $scope.$apply();
    })
    if ($scope.score == undefined) {
      $scope.score = 15;
    }
    $scope.api.getActions($routeParams.id, function (actions) {
      if ($scope.yourCommands[0] == undefined) {
        return;
      }

      $scope.actions = actions;
      for (var i = 0, l = $scope.actions.length; i < l; i++) {
        var v = $scope.actions[i];
        if ($scope.doneActions.includes(v.id)) {
          continue;
        }
        if (JSON.stringify(v.target) === JSON.stringify($scope.yourCommands[0]) ) {
          v.score = $scope.score;
          $scope.api.updateAction(v, function (action) {
            $scope.yourCommands.shift();
            $scope.score = 15;
            $scope.$apply();
          })
        }
        $scope.doneActions.push(v.id);
      }
      $scope.$apply();
    })
    $scope.score -= 1;
    if ($scope.score < 0) {
      $scope.score = 0;
    }
  }
  $scope.getActions();
  $scope.actionsInterval = $interval($scope.getActions, 1000);

  $scope.cmdToHuman = function (cmd) {
    if (cmd == undefined || cmd == null) {
      return 'no commands';
    }

    switch (cmd.type) {
      case 'button':
        return 'Hit the ' + cmd.label + ' button'
      case 'radio':
          return 'Set ' + cmd.label + ' to ' + cmd.output;
      case 'rating':
          return 'Set ' + cmd.label + ' to ' + cmd.output;
      case 'switch':
          return 'Set ' + cmd.label + ' to ' + cmd.output;
      default:
          return 'unknown command type';
    }
  };

  $scope.goBack = function () {
    $interval.cancel($scope.actionsInterval);
    $scope.goTo('/');
  }
});
