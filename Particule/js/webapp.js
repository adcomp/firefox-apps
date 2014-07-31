(function () {

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var ctx,
    canvas,
    width,
    height,
    emitter,
    lastUpdate = Date.now();

function init() {
  canvas = document.getElementById('render')
  ctx = canvas.getContext('2d')
  resizeCanvas();
  emitter = new Emitter();

  // events
  canvas.addEventListener('mousemove', function(evt) {
      if (emitter.config["followMouse"]) {
        var mousePos = getMousePos(canvas, evt);
        emitter.x = mousePos.x;
        emitter.y = mousePos.y;
      }
  }, false);

  window.addEventListener('resize', resizeCanvas, false);


  $('#render').click(function(e) {
    emitter.x = e.clientX;
    emitter.y = e.clientY;
  });

  $('#show_ctrl').click(function(e) {
    $('#controls').slideToggle();
  });

  $('input:checkbox').change(function() {
      var val = $('#'+this.id).is(':checked');
      emitter.config[this.id] = val
      if (this.id == "followMouse" || this.id == "automove") {
          emitter.x = width / 2;
          emitter.y = height / 2;
      }
  })

  $('.range').change(function() {
      var val = $('#'+this.id).val();

      if (this.id == "alpha") {
          emitter.config[this.id] = parseInt(val, 10)/100;
      } else {
          emitter.config[this.id] = parseInt(val, 10);
      }
  })

    loop();
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, width, height)

    if (emitter) {
      emitter.x = width / 2;
      emitter.y = height / 2;
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function loop() {
    date = new Date();
    now = date.valueOf();
    delta = (now - lastUpdate)/1000;
    lastUpdate = now;
    emitter.update(delta);
    requestAnimFrame(loop);
}


var Emitter = function() {
    this.particles = [];
    this.mode = "";
    this.effect = "";
    this.x = width/2;
    this.y = height/2;
    this.time = 0;
    this.particlesNum = 2;
    this.colorAlpha = 0.8;
    this.vx = 100 - Math.random()*200;
    this.vy = 100 - Math.random()*200;
    this.width = 0;
    this.height = 0;

    this.config = {
        lifetime: 2,
        rate: 5,
        color: 180,
        speed: 20,
        alpha: 1,
        size: 4,
        gravity: 0,
        followMouse: false,
        randomColor: false,
        cycleColor: false,
        circle: false,
        bouncing: false,
        vortex: false,
        automove: false,
    }


    this.update = function(delta) {
        ctx.fillStyle = 'rgba(0,0,0,' + this.config["alpha"] + ')';
        ctx.fillRect(0, 0, width, height)

        if (this.config["vortex"] && Math.random() < 0.01) {
                this.vx = 2*(100 - Math.random()*200);
                this.vy = 2*(100 - Math.random()*200);
        }

        if (this.config["automove"]) {

            if (Math.random() < 0.1) {
                this.vx = 2*(100 - Math.random()*200);
                this.vy = 2*(100 - Math.random()*200);
            }

            this.x += delta * this.vx;
            this.y += delta * this.vy;

            if (this.x < 0 || this.x > width) { this.vx *= -1; }
            if (this.y < 0 || this.y > height) { this.vy *= -1; }
        }

        if (this.config["randomColor"]) { this.config["color"] = Math.random()*360; }

        // new particles push
        this.time += delta;
        if (this.time > (20 - this.config["rate"])/100) {
            for (var i=0; i < this.particlesNum; i++) {
                x = this.x + Math.random() * this.width;
                y = this.y + Math.random() * this.height;
                this.particles.push(new Particle(this, x, y));
            }
            this.time = 0;
        }

        for (var i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].destroy) {
                this.particles.splice(i, 1);
            }
        }
        for (var i in this.particles) {
            this.particles[i].update(delta)
            this.particles[i].draw()
        }
      if (this.config["cycleColor"]) { this.config["color"] += delta*16; }

    }

}

var Particle = function(em, x, y) {
    this.emitter = em;
    this.x = x;
    this.y = y;
    this.dx = 1 - Math.random() * 2;
    this.dy = 1 - Math.random() * 2;
    this.size = this.emitter.config["size"] + Math.random() * this.emitter.config["size"] * 2
    this.destroy = false;
    this.lifetime = this.emitter.config["lifetime"] + Math.random()*this.emitter.config["lifetime"];
    this.life = 0;
    this.color = this.emitter.config["color"];
    this.colorAlpha = this.emitter.colorAlpha;

    this.update = function(delta) {
        this.life += delta;

        if (this.emitter.config["vortex"]) {
            this.x = this.emitter.x + this.life * this.emitter.config["speed"] * Math.cos(this.life);
            this.y = this.emitter.y + this.life * this.emitter.config["speed"] * Math.sin(this.life);
        }
        else {

            this.x += this.dx * delta * this.emitter.config["speed"];
            if (this.emitter.config["gravity"] != 0) {
                this.y +=  this.emitter.config["gravity"] * delta * this.emitter.config["speed"];
            } else {
                this.y += this.dy * delta * this.emitter.config["speed"];
            }
        }

        // slowly increase dx & dy
        this.dx *= 1.01
        this.dy *= 1.01

        // sometimes, re-randomize dx & dy
        if (this.emitter.config["bouncing"] && Math.random() < .1) {
            this.dx = 1 - Math.random() * 2
            this.dy = 1 - Math.random() * 2
        }

        if (this.life > this.emitter.config["lifetime"]) {
            this.destroy = true
        }
    }

    this.draw = function() {
        var alpha = this.colorAlpha * (this.lifetime - this.life)/this.lifetime;
        ctx.save();

        ctx.fillStyle = "hsla(" + this.color + ", 70%, 50%, " + alpha + ")"
        ctx.strokeStyle = "hsla(" + this.color + ", 70%, 50%, " + alpha + ")"

        if (this.emitter.config["vortex"]) {
            ctx.translate(width/2, height/2);
            ctx.rotate(this.life*Math.PI);
            ctx.translate(-width/2, -height/2);
        }
        ctx.beginPath()
        if (this.emitter.config["circle"]) {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, true)
        } else {
            ctx.rect(this.x, this.y, this.size, this.size)
        }
        ctx.closePath()
        if (this.emitter.config["fill"]) {
            ctx.fill();
        } else {
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }
}


window.onload = init;

})();




