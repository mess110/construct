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
  for (array = this, m = array.length, t = void 0, i = void 0; m; ) i = Math.floor(Math.random() * m--),
  t = array[m], array[m] = array[i], array[i] = t;
  return array;
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
    $scope.game.status = 'play'

    $scope.game.players = [];
    for (var i = 0, l = $scope.players.length; i < l; i++) {
      var v = $scope.players[i];
      $scope.game.players.push(v.ownId);
    }

    $scope.gameMaker = new GameMaker({ size: $scope.game.players.length });
    $scope.game.maker = $scope.gameMaker.toJson()

    $scope.api.updateGame($scope.game, function (game) {
      $interval.cancel($scope.playersPromise);
      $interval.cancel($scope.gamePromise);
      $scope.goTo('/games/' + $routeParams.id);
      $scope.$apply();
    })
  }

  $scope.refreshPlayers = function () {
    console.log('refreshing players');
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
  $scope.gamePromise = $interval($scope.getGame, 5000);
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

app.controller('GameController', function ($scope, $routeParams, $interval) {
  $scope.uiRows = [];
  $scope.doneActions = [];

  $scope.api.getGame($routeParams.id, function (game) {
    $scope.game = game[0];
    $scope.ownIndex = $scope.game.players.indexOf($scope.ownId);
    console.log($scope.game);

    $scope.uiRows = [
      [
        $scope.game.maker.buttons[$scope.ownIndex],
        $scope.game.maker.radios[$scope.ownIndex]
      ],
      [
        $scope.game.maker.switches[$scope.ownIndex],
        $scope.game.maker.ratings[$scope.ownIndex]
      ]
    ]
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
    $scope.api.getActions($routeParams.id, function (actions) {
      $scope.actions = actions;
      for (var i = 0, l = $scope.actions.length; i < l; i++) {
        var v = $scope.actions[i];
        if ($scope.doneActions.includes(v.id)) {
          continue;
        }
        if (JSON.stringify(v.target) === JSON.stringify($scope.yourCommands[0]) ) {
          $scope.yourCommands.shift();
          console.log('done');
          $scope.doneActions.push(v.id);
          break;
        } else {
          $scope.doneActions.push(v.id);
        }
      }
      $scope.$apply();
    })
  }
  $scope.getActions();
  $scope.actionsInterval = $interval($scope.getActions, 1000);

  $scope.cmdToHuman = function (cmd) {
    if (cmd == undefined || cmd == null) {
      return 'no commands';
    }
    switch (cmd.type) {
      case 'button':
        return 'quickly ' + cmd.label
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
    $interval.cancel($scope.actionsInterval)
    $scope.goTo('/');
  }
});
