class GameMaker {
  constructor(options = {}) {
    this.options = options;

    if (this.options.size == undefined || this.options.size == null) {
      throw new Error('unknown player size');
    }
    if (this.options.size > 4) {
      throw new Error('too many players');
    }
    if (this.options.size < 2) {
      throw new Error('requires at least 2 players');
    }

    this.types = ['button', 'switch', 'radio', 'rating'];

    this.buttons = [
      { label: 'Eject CD', type: 'button' },
      { label: 'Deploy', type: 'button' },
      { label: 'Restart', type: 'button' },
      { label: 'Cleanup Table', type: 'button' },
      { label: 'Make soup', type: 'button' }
    ].shuffle();

    this.switches = [
      { label: 'Engine', type: 'switch', output: false },
      { label: 'Shield', type: 'switch', output: false },
      { label: 'Fail-safe', type: 'switch', output: false },
      { label: 'Air-Breaks', type: 'switch', output: false },
      { label: 'Abs', type: 'switch', output: false }
    ].shuffle();

    this.radios = [
      { label: 'Spectrum', labels: ['red', 'green', 'blue'], output: 'red', type: 'radio' },
      { label: 'Phasers', labels: ['front', 'back'], output: 'front', type: 'radio' },
      { label: 'Light Intensity', labels: ['low', 'average', 'high'], output: 'low', type: 'radio' },
      { label: 'Sound Intensity', labels: ['low', 'average', 'high'], output: 'low', type: 'radio'  },
      { label: 'Engine Mode', labels: ['2wd', '4wd', 'sonic', 'supersonic'], output: '2wd', type: 'radio' }
    ].shuffle();

    this.ratings = [
      { label: 'Power', max: 11, output: 0, type: 'rating' },
      { label: 'Speed', max: 11, output: 0, type: 'rating'  },
      { label: 'Radar Range', max: 11, output: 0, type: 'rating' },
      { label: 'Scout Range', max: 11, output: 0, type: 'rating' },
      { label: 'Overdrive', max: 11, output: 0, type: 'rating' }
    ].shuffle();

    this.commands = [];
    for (var i = 0, l = this.options.size; i < l; i++) {
      for (var j = 0, k = commandsPerPlayer; j < k; j++) {
        var randomElement = this.random(this.types);
        // TODO: ternary operator
        if (randomElement == 'switch')
          randomElement = 'switches'
        else
          randomElement += 's'
        var visibleElements = this[randomElement].slice(0, this.options.size);
        var visibleElement = this.random(visibleElements, [this[randomElement][i]]);

        if (visibleElement.type == 'switch') {
          visibleElement.output = !visibleElement.output;
        }
        if (visibleElement.type == 'radio') {
          visibleElement.output = this.random(visibleElement.labels, [visibleElement.output]);
        }
        if (visibleElement.type == 'rating') {
          var original = visibleElement.output;
          visibleElement.output = getRandomInt(0, visibleElement.max);
          if (original == visibleElement.output) {
            visibleElement.output -= 1;
            if (visibleElement.output < 0) {
              visibleElement.output = visibleElement.max - 1;
            }
          }
        }
        this.commands.push(JSON.parse(JSON.stringify(visibleElement)));
      }
    }
    this.resetElements();
  }

  resetElements() {
    for (var i = 0, l = this.radios.length; i < l; i++) {
      var v = this.radios[i];
      v.output = v.labels[0];
    }

    for (var i = 0, l = this.ratings.length; i < l; i++) {
      var v = this.ratings[i];
      v.output = 0;
    }

    for (var i = 0, l = this.switches.length; i < l; i++) {
      var v = this.switches[i];
      v.output = false;
    }
  }

  toJson() {
    return {
      buttons: this.buttons,
      switches: this.switches,
      radios: this.radios,
      ratings: this.ratings,
      commands: this.commands
    }
  }

  fromJson(json) {
    this.buttons = json.buttons;
    this.switches = json.switches;
    this.radios = json.radios;
    this.ratings = json.ratings;
    this.commands = json.commands;
  }

  random(items, except=[]) {
    var tmpArray = [];
    for (var i = 0, l = items.length; i < l; i++) {
      var v = items[i];
      var add = true;
      for (var j = 0, k = except.length; j < k; j++) {
        var vv = except[j];
        if (JSON.stringify(v) === JSON.stringify(vv) ) {
          add = false;
        }
      }
      if (add) {
        tmpArray.push(v);
      }
    }
    return tmpArray[Math.floor(Math.random()*tmpArray.length)];
  }
}

