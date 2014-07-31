
// http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


window.onload = function() {

  game.init();
  $('#menu').show();
  $('#game-layer').mousemove(function(evt) { game.setColPos(evt); });
  $('#game-layer').click(function(evt) {
    var offset = $(this).offset();
    if (evt.clientY - offset.top < 64) {
      game.play();
    } else {
      game.addBlock(evt);
    }
  });
  $('#bt_play').click(function() { game.play(); });
  $('h2').click(function() { game.toggleAudio(this.id); });
  $(document).keydown(function(e) {
      if (game.state == "running") {
        // left
        if (e.keyCode == 37 && game.colPos > 0) { game.colPos -= 1 }
        // right
        if (e.keyCode == 39 && game.colPos < game.grid.cols-1) { game.colPos += 1 }
        // spacebar
        if (e.keyCode == 32) { game.addBlock(); }
      }
      console.log(e.keyCode);
  });

  //~ window.addEventListener('resize', resizeGame, false);
  //~ window.addEventListener('orientationchange', resizeGame, false);

};

// The main game loop
var loop = function () {
  if (game.state == "running") {
    var now = Date.now();
    var delta = now - game.lastUpdate;

    game.update(delta / 1000);
    game.render();
    game.lastUpdate = now;

    requestAnimationFrame(loop);
    //~ setTimeout('loop()', 100);
  }
};

var game = {
  canvas: null,
  ctx: null,
  width: 320,
  height: 480,
  sound: true,
  music: true,
  state: "stop",
  isOver: false,
  lastUpdate: 0,
  color: [10, 50, 120, 200, 280],
  blk_anim: 1.0,
  needCheck: false,
  grid: null,

  // game var.
  level: 1,
  score: 0,
  hiscore: 0,
  padding: 4,
  blk_padding: 1,
  colPos: 0,
  nextColor: 0,
  nextColor2: 0,

  // timer for next line
  lifeTime: 0,
  lineTime: 10,

  debug: false,

  init: function() {
    //~ this.canvas = document.getElementById('game-layer');
    this.ctx = document.getElementById('game-layer').getContext('2d');
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;

    this.grid = new Grid(7, 9);
    this.reset();
    this.blk_size = (this.width - 2 * this.padding) / this.grid.cols;
    this.drawBackground();
    $('#audio_track').trigger('play');
  },

  reset: function() {
    this.lifeTime = this.lineTime;
    this.score = 0;
    this.level = 1;
    this.nextColor = this.getRandomType();
    this.nextColor2 = this.getRandomType();
    this.nextLevel = 1500;
    this.lineTime = 10;
    this.colPos = Math.floor(this.grid.cols / 2);
    this.isOver = false;
    this.lastUpdate = Date.now();
    this.grid.init();
    this.grid.addFirstLine();
  },

  toggleAudio: function(type) {
    if (type == "sound") {
      if (this.sound) {
        this.sound = false;
        $('#sound_onoff').addClass('off');
      } else {
        this.sound = true;
        $('#sound_onoff').removeClass('off');
      }
    } else if (type == "music") {
      if (this.music) {
        this.music = false;
        $('#music_onoff').addClass('off');
        $("#audio_track").trigger('pause');
      } else {
        this.music = true;
        $('#music_onoff').removeClass('off');
        $("#audio_track").trigger('play');
      }
    }
  },

  playSound: function(id) {
    if (this.sound) {
      $('#audio_'+id).trigger('pause');
      $('#audio_'+id).prop("currentTime",0);
      $('#audio_'+id).trigger('play');
    }
  },

  play: function() {
    console.log(this.state);
    if (this.state == 'pause') {
      this.lastUpdate = Date.now()
      $('#menu').slideUp();
      this.state = 'running';
      loop();
    } else if (this.state == 'running') {
      this.state = 'pause';
      $('#menu').show();
    } else if (this.state == 'stop') {
      this.state = 'running';
      $('#menu').slideUp();
      this.reset();
      loop();
    }
    console.log(this.state);
  },

  setColPos: function(evt) {
    var rect = this.ctx.canvas.getBoundingClientRect();
    var ratio = $('#game-layer').width() / this.grid.cols;
    this.colPos =  Math.floor((evt.clientX - rect.left) / ratio);
    if (this.colPos >= this.grid.cols) { this.colPos = this.grid.cols - 1; }
  },

  update: function(delta) {
    if (this.state == "running") {

      if (this.needCheck) {
        do {
          this.grid.checkFull();
          var ret = this.grid.fallingBlock();
        } while (ret);
      }


      this.lifeTime -= delta;
      if (this.lifeTime < 0) {
        // new line
        this.grid.addLine();
        this.needCheck = true;
        this.lifeTime = this.lineTime;
      }
    }

    var combo_score = 0;
    for (var col = 0; col < this.grid.cols; col++) {
      for (var row = 0; row < this.grid.rows; row++) {
        if (this.grid.blocks[col][row] && this.grid.blocks[col][row].destroy) {
          this.grid.blocks[col][row].lifeTime -= delta;
        }

        if (this.grid.blocks[col][row] && this.grid.blocks[col][row].destroy && this.grid.blocks[col][row].lifeTime < 0) {
          this.grid.blocks[col][row] = 0;
          this.updateScore(10);
          combo_score += 1;
          this.needCheck = true;
        }
      }
    }

    //~ if (combo_score) { this.playSound('match'); }

    if (combo_score>3) {
      this.playSound('combo');
      this.updateScore((combo_score-3)*10);
    }

    if (this.nextLevel <= 0) {
      this.nextLevel = 1500;
      this.level += 1;
      this.lineTime -= 1;
    }

    if (this.state == "running" && this.isOver) {
      this.playSound('over');
      if (this.score > this.hiscore) {
        this.hiscore = this.score;
        alert('Your score : ' + this.score + '\nNew Hiscore : ' + this.hiscore);
      } else {
        alert('Your score : ' + this.score);
      }
      $('#score').text(this.score);
      $('#menu').slideToggle();
      this.state = "stop";
    }
  },

  render: function() {
    // clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // LEVEL & SCORE
    this.ctx.fillStyle = 'white';
    this.ctx.font = "bold 14pt 'Fira Sans', 'Droid Sans', Ubuntu";
    this.ctx.fillText(this.level, this.padding + 60, 18);
    this.ctx.fillText(zeroPad(this.score, 6), this.width - this.padding - 70, 18);

    // TIMER ( next color 1 & 2 )
    var y = this.blk_size / 2 + 4;
    var h = this.blk_size / 2 - 8;
    var w = (this.width - this.blk_size/2 - 2 * this.padding ) * (this.lifeTime / this.lineTime) ;
    w = Math.floor(w);

    this.ctx.fillStyle = "hsla(" + this.color[this.nextColor] + ", 100%, 50%, 1)";
    this.ctx.fillRect(this.padding + 2, y, w, h);

    var x = this.width - this.blk_size/2 - this.padding + 2;

    this.ctx.fillStyle = "hsla(" + this.color[this.nextColor2] + ", 100%, 50%, 1)";
    this.ctx.fillRect(x, y, this.blk_size/2 - 8, h);

    this.drawNextBlock();

    for (var col = 0; col < this.grid.cols; col++) {
      for (var row = 0; row < this.grid.rows; row++) {
        if (this.debug) {
          this.drawDebug(col, row);
        }
        if (this.grid.blocks[col][row]) {
          this.drawBlock(col, row, this.grid.blocks[col][row].type);
        }
      }
    }
  },

  updateScore: function(val) {
    this.score += val;
    this.nextLevel -= val;
  },

  addBlock: function() {
    if (this.state != 'running') { return; }

    if (this.grid.addBlock(this.colPos, this.nextColor)) {
      if (this.grid.checkType(this.nextColor)) {
        do {
          var ret = this.grid.fallingBlock();
        } while (ret);
      }
      this.updateScore(10);
      this.nextColor = this.nextColor2;
      this.nextColor2 = this.getRandomType();
      this.playSound('shoot');
    } else {
      this.playSound('locked');
    }
  },

  drawDebug: function (col, row) {
    this.ctx.lineWidth = 2;
    x = Math.floor(this.padding + col * this.blk_size + this.blk_padding);
    y = Math.floor(this.padding + row * this.blk_size + this.blk_padding + this.blk_size);
    size = Math.floor(this.blk_size - this.blk_padding * 2);
    this.ctx.font = "bold 8pt 'Fira Sans', 'Droid sans', 'Ubuntu'";
    this.ctx.strokeStyle = "rgba(50, 50, 50, .5)";
    this.ctx.strokeRect(x+1, y+1, size-2, size-2);

    this.ctx.strokeStyle = "white";
    this.ctx.strokeText(col+' , '+row, x + 10, y + 24);
  },

  drawBlock: function (col, row, val) {
    this.ctx.lineWidth = 4;
    var x = Math.floor(this.padding + col * this.blk_size + this.blk_padding);
    var y = Math.floor(this.padding + row * this.blk_size + this.blk_padding + this.blk_size);
    var size = Math.floor(this.blk_size - this.blk_padding * 2);

    var alpha = Math.abs(Math.cos(this.grid.blocks[col][row].lifeTime / this.blk_anim));
    if (this.grid.blocks[col][row].destroy) {
      this.ctx.fillStyle = "hsla(" + this.color[val] + ", 100%, 50%, " +  alpha +")";
    } else {
      this.ctx.fillStyle = "hsla(" + this.color[val] + ", 100%, 50%, 1)";
    }
    this.ctx.fillRect(x, y, size, size);

    this.ctx.strokeStyle = "rgba(50, 50, 50, .5)";
    this.ctx.strokeRect(x+1, y+1, size-2, size-2);

    if (this.debug && this.grid.blocks[col][row] && this.grid.blocks[col][row].destroy) {
      this.ctx.strokeStyle = "black";
      this.ctx.strokeText(col+' , '+row, x + 10, y + 24);
    }
  },

  drawNextBlock: function() {
    this.ctx.lineWidth = this.blk_padding;
    var x = this.padding + this.colPos * this.blk_size + this.blk_padding;
    var y = this.padding + (1+this.grid.rows) * this.blk_size + this.blk_padding;

    // next block ( height/2 )
    var size = this.blk_size - this.blk_padding  *2;
    this.ctx.fillStyle = "hsla(" + this.color[this.nextColor] + ", 100%, 50%, 1)";
    this.ctx.strokeStyle = "rgba(50, 50, 50, 0.5)";
    this.ctx.fillRect(x, y, size, size/2);
    this.ctx.strokeRect(x+1, y+1, size-2, size/2-2);

    // column shadow
    this.ctx.fillStyle = "rgba(40, 90, 150, 0.2)";
    //~ this.ctx.fillStyle = "hsla(" + this.color[this.nextColor] + ", 100%, 50%, 0.2)";
    this.ctx.fillRect(x, this.padding + this.blk_size, this.blk_size - 2*this.blk_padding, y - this.padding - this.blk_size);
  },

  drawBackground: function() {
    var ctx = document.getElementById('background-layer').getContext('2d');

    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.strokeStyle = '#031E33';
    ctx.lineWidth = 2;

    var w = this.grid.cols * this.blk_size;
    var h = (this.grid.rows + 0.5) * this.blk_size;
    ctx.strokeRect(this.padding, this.padding + this.blk_size, w, h);

    for (var col = 1; col < this.grid.cols; col++) {
      ctx.beginPath();
      ctx.moveTo(this.padding + col * this.blk_size, this.padding + this.blk_size);
      ctx.lineTo(this.padding + col * this.blk_size, h + this.padding + this.blk_size);
      ctx.stroke();
    }

    for (var row = 1; row < this.grid.rows + 1; row++) {
      ctx.beginPath();
      ctx.moveTo(this.padding, this.padding + (1 + row) * this.blk_size);
      ctx.lineTo(this.padding + w, this.padding + (1 + row) * this.blk_size);
      ctx.stroke();
    }

    // LEVEL & SCORE
    ctx.fillStyle = 'rgba(120, 160, 240, 1)';
    ctx.font = "bold 14pt 'Fira Sans', 'Droid Sans', Ubuntu";
    ctx.fillText("LEVEL", this.padding, 18);
    ctx.fillText("SCORE", game.width - game.padding - 140, 18);

    // timer
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(this.padding, this.blk_size / 2, this.width - 2 * this.padding, this.blk_size / 2);
  },

  getRandomType: function() {
    return Math.floor(Math.random() * 5);
  },

  resize: function() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.blk_size = (this.width - 2 * this.padding) / this.grid.cols;
  },
}

var Grid = function(cols, rows) {
  this.cols = cols;
  this.rows = rows;
  this.blocks = [];

  this.init = function(level) {
    for (var col=0; col < this.cols; col++) {
      this.blocks[col] = [];
      for (var row=0; row < this.rows; row++) {
          this.blocks[col][row] = 0;
      }
    }
  };

  this.addBlock = function(col, type) {
    // row is full ?
    if (this.blocks[col][this.rows-1]) {
      console.log("addBlock, row full ..");
      return;
    }

    if (!this.blocks[col][0]) {
      // col empty
      this.blocks[col][0] = new Block(type);
      return true;
    } else {
      var index = this.rows - 1;
      while (index > 0) {
        if (this.blocks[col][index-1]) {
          this.blocks[col][index] = new Block(type);
          return true;
        } else {
          index -= 1;
        }
      }
    }
    return false;
  };

  this.addFirstLine = function () {
    this.blocks[0][0] = new Block();
    var last = this.blocks[0][0].type;
    for (var col = 1; col < this.cols; col++) {
      this.blocks[col][0] = new Block();
      while (this.blocks[col][0].type == last) {
        this.blocks[col][0].type = game.getRandomType();
      }
      last = this.blocks[col][0].type;
    }
  };

  this.addLine = function () {
    for (var col = 0; col < this.cols; col++) {
      if (this.blocks[col][this.rows-1]) {
        game.isOver = true;
        return;
      }
    }

    for (var col = 0; col < this.cols; col++) {
      this.blocks[col].unshift(new Block());
      this.blocks[col].pop()
    }
  };

  this.checkType = function(type) {

    var match = false;

    for (var col = 0; col < this.cols-1; col++) {
      for (var row = 0; row < this.rows-1; row++) {

        // ##
        // #.
        if (this.checkBlock(col, row, type) && this.checkBlock(col+1, row, type) && this.checkBlock(col, row+1, type)) {

              this.blocks[col][row].destroy = true;
              this.blocks[col+1][row].destroy = true;
              this.blocks[col][row+1].destroy = true;
              match = true;
        }

        // ##
        // .#
        if (this.checkBlock(col, row, type) && this.checkBlock(col+1, row, type) && this.checkBlock(col+1, row+1, type)) {

              this.blocks[col][row].destroy = true;
              this.blocks[col+1][row].destroy = true;
              this.blocks[col+1][row+1].destroy = true;
              match = true;
        }

        // #.
        // ##
        if (this.checkBlock(col, row, type) && this.checkBlock(col+1, row+1, type) && this.checkBlock(col, row+1, type)) {

              this.blocks[col][row].destroy = true;
              this.blocks[col+1][row+1].destroy = true;
              this.blocks[col][row+1].destroy = true;
              match = true;
        }

        // .#
        // ##
        if (this.checkBlock(col+1, row, type) && this.checkBlock(col, row+1, type) && this.checkBlock(col+1, row+1, type)) {

              this.blocks[col+1][row].destroy = true;
              this.blocks[col][row+1].destroy = true;
              this.blocks[col+1][row+1].destroy = true;
              match = true;
        }
      }
    }

    for (var col = 0; col < this.cols; col++) {
      for (var row = 0; row < this.rows-2; row++) {

        // ###
        if (col+2 < this.cols) {
          if (this.checkBlock(col, row, type) && this.checkBlock(col+1, row, type) && this.checkBlock(col+2, row, type)) {

                this.blocks[col][row].destroy = true;
                this.blocks[col+1][row].destroy = true;
                this.blocks[col+2][row].destroy = true;
                match = true;
          }
        }

        // #
        // #
        // #
        if (this.checkBlock(col, row, type) && this.checkBlock(col, row+1, type) && this.checkBlock(col, row+2, type)) {

              this.blocks[col][row].destroy = true;
              this.blocks[col][row+1].destroy = true;
              this.blocks[col][row+2].destroy = true;
              match = true;
        }

      }
    }
    if (match) { game.playSound('match'); }
    return match;
  };

  this.checkBlock = function(col, row, type) {
    return this.blocks[col][row] && this.blocks[col][row].type === type && this.blocks[col][row].lifeTime === game.blk_anim
  };

  this.checkFull = function() {
    for (var type = game.color.length-1; type >= 0; type--) {
      this.checkType(type);
    }
  };

  this.fallingBlock = function () {
    var falling = false;
    for (var col = 0; col < this.cols; col++) {
      for (var row = 1; row < this.rows; row++) {
        if (this.blocks[col][row-1] === 0 && this.blocks[col][row]) {
          var ind = row-1;
          while (ind-1 > 0 && this.blocks[col][ind-1] === 0) {
            ind -= 1;
          }
          this.blocks[col][ind] = this.blocks[col][row];
          this.blocks[col][row] = 0;
          falling = true;
        }
      }
    }
    return falling;
  };

}

var Block = function(type) {
  if (null == type) {
    type = game.getRandomType();
  }
  this.destroy = false;
  this.type = type;
  this.lifeTime = game.blk_anim;
}


// http://stackoverflow.com/users/5445/cms
function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

// Pause and resume on page becoming visible/invisible
function onVisibilityChanged() {
  if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden)
    setSuspended(true);
  else
    setSuspended(false);
};
