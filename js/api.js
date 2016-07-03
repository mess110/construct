class Api {
  constructor(options) {
    this.options = options;
  }

  getAll(callback) {
    jNorthPole.getStorage(this.options, callback, this.error);
  }

  createGame(ownerId, callback) {
    var json = angular.copy(this.options);
    json.ownerId = ownerId;
    json.team_builder_type = 'game';
    json.status = 'lobby';
    jNorthPole.createStorage(json, callback, this.error);
  }

  joinGame(ownId, gameId, callback) {
    var json = angular.copy(this.options);
    json.ownId = ownId;
    json.gameId = gameId;
    json.team_builder_type = 'player';
    jNorthPole.createStorage(json, callback, this.error);
  }

  getPlayers(gameId, callback) {
    var json = angular.copy(this.options);
    json.team_builder_type = 'player';
    json.gameId = gameId;
    jNorthPole.getStorage(json, callback, this.error);
  }

  getGame(gameId, callback) {
    var json = angular.copy(this.options);
    json.id = gameId;
    jNorthPole.getStorage(json, callback, this.error);
  }

  updateGame(game, callback) {
    var json = angular.copy(game);
    json.version = this.options.version;
    json.api_key = this.options.api_key;
    json.secret = this.options.secret;
    jNorthPole.putStorage(json, callback, this.error);
  }

  updateAction(action, callback) {
    var json = angular.copy(action);
    json.version = this.options.version;
    json.api_key = this.options.api_key;
    json.secret = this.options.secret;
    jNorthPole.putStorage(json, callback, this.error);
  }

  getScore(gameId, callback) {
    var totalScore = 0;
    var json = angular.copy(this.options);
    json.team_builder_type = 'action';
    json.gameId = gameId;
    jNorthPole.getStorage(json, function (actions) {
      for (var i = 0, l = actions.length; i < l; i++) {
        var v = actions[i];
        if (v.score != undefined && v.score != null) {
          totalScore += v.score;
        }
      }
      callback(totalScore);
    }, this.error);
  }

  getGames(callback) {
    var json = angular.copy(this.options);
    json.team_builder_type = 'game';
    json.status = 'lobby';
    json.__sort = { created_at: 'desc' };
    jNorthPole.getStorage(json, callback, this.error);
  }

  click(target, callback) {
    var json = angular.copy(target);
    json.version = this.options.version;
    json.api_key = this.options.api_key;
    json.secret = this.options.secret;
    json.team_builder_type = 'action';
    jNorthPole.createStorage(json, callback, this.error);
  }

  getActions(gameId, callback) {
    var json = angular.copy(this.options);
    json.team_builder_type = 'action';
    json.gameId = gameId;
    json.__limit = 10;
    json.__sort = { created_at: 'desc' };
    jNorthPole.getStorage(json, callback, this.error);
  }

  getHighScores(callback) {
    var json = angular.copy(this.options);
    json.team_builder_type = 'game';
    jNorthPole.getStorage(json, callback, this.error);
  }

  log(data) {
    console.log(data);
  }

  error(data) {
    console.log(data);
  }
}
