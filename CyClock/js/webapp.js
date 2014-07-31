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
    size = 32,
    radius = 0,
    hue = 0,
    cycling = false,
    rounded = false,
    division = false,
    dot = false,
    path = false,
    alpha = 0.5,
    timer = 0,
    lastUpdate = Date.now();

function init() {
    canvas = document.getElementById('clock')
    ctx = canvas.getContext('2d')
    resizeCanvas();
    lineWidth = radius / 8;

    // events
    window.addEventListener('resize', resizeCanvas, false);

    $('#show_ctrl').click(function() {
      $('#controls').slideToggle();
    });

    $('#size').change(function() {
      size = $('#size').val();
    });

    $('#hue').change(function() {
      hue = $('#hue').val();
    });

    $('#cycling').change(function() {
      cycling = $('#cycling').is(':checked');
    });

    $('#path').change(function() {
      path = $('#path').is(':checked');
    });

    $('#rounded').change(function() {
      rounded = $('#rounded').is(':checked');
    });

    $('#division').change(function() {
      division = $('#division').is(':checked');
    });

    loop();
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
    radius = Math.min(width, height)/2 * 0.8;
}

function loop() {
    date = new Date();
    now = date.valueOf();
    delta = (now - lastUpdate)/1000;

    lastUpdate = now;
    timer += delta;

    if (timer >= 1) {
      hours = date.getHours();
      minutes = date.getMinutes();
      if (minutes < 10) { minutes = '0' + minutes; }
      str_date = date.toDateString();
      $('#hours').text(hours);
      $('#minutes').text(minutes);
      $('#date').text(str_date);
    }

    if (cycling) {
        color += delta * 10;
    } else {
        color = parseInt(hue);
    }
    lineWidth = size;

    draw();
    requestAnimFrame(loop);
}

function draw() {

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    if (rounded) {
        ctx.lineCap = 'round';
    } else {
        ctx.lineCap = 'butt';
    }

    var now = new Date();
    var angle_0 = - Math.PI / 2;

    ctx.save();
    ctx.translate(width/2, height/2);

    var sec = now.getSeconds();
    var min = now.getMinutes();
    var hr  = now.getHours();
    hr = (hr >= 12) ? hr-12 : hr;

    // Show division
    if (division) {
        if (rounded) {
            ctx.lineWidth = lineWidth / 10;
            ctx.strokeStyle = "hsla(" + color + ", 50%, 50%, .4)";
            strokeCircle(0, 0, lineWidth/4, 0, Math.PI*2, true);
            for (var i=0; i < 12; i++) {
                x = Math.cos(i*Math.PI/6)*radius;
                y = Math.sin(i*Math.PI/6)*radius;
                strokeCircle(x, y, lineWidth/4, 0, Math.PI*2, true);
            }
        } else {
            ctx.lineWidth = lineWidth / 10;
            ctx.strokeStyle = "hsla(" + color + ", 50%, 50%, .4)";
            for (var i=0; i < 12; i++) {
                x0 = Math.cos(i*Math.PI/6) * (radius * 0.33 - lineWidth/2);
                y0 = Math.sin(i*Math.PI/6) * (radius * 0.33 - lineWidth/2);
                x1 = Math.cos(i*Math.PI/6) * (radius + lineWidth/2);
                y1 = Math.sin(i*Math.PI/6) * (radius + lineWidth/2);
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.stroke();
            }
        }
    }

    ctx.lineWidth = lineWidth;

    // Dessin des heures
    angle = hr * Math.PI / 6;

    ctx.strokeStyle = "hsl(" + (color + 32) + ", 50%, 50%)";
    if (dot) {
        x = Math.cos(angle_0 + angle) * radius * 0.33;
        y = Math.sin(angle_0 + angle) * radius * 0.33;
        strokeCircle(x, y, lineWidth/4, 0, 2*Math.PI, true);
    } else {
        strokeCircle(0, 0, radius *.33, angle_0, angle_0 + angle, false);
    }
    if (path) {
        ctx.strokeStyle = "hsla(" + (color + 32) + ", 50%, 50%, .2)"
        strokeCircle(0, 0, radius *.33, angle_0, angle_0 + angle, true);
    }

    // Dessin des minutes
    angle =  Math.PI / 30 * min;

    ctx.beginPath();
    ctx.strokeStyle = "hsl(" + (color + 16) + ", 50%, 50%)"
    if (dot) {
        x = Math.cos(angle_0 + angle) * radius * 0.66;
        y = Math.sin(angle_0 + angle) * radius * 0.66;
        strokeCircle(x, y, lineWidth/4, 0, 2*Math.PI, true);
    } else {
        strokeCircle(0, 0, radius *.66, angle_0, angle_0 + angle, false);
    }
    if (path) {
        ctx.strokeStyle = "hsla(" + (color + 16) + ", 50%, 50%, .2)"
        strokeCircle(0, 0, radius *.66, angle_0, angle_0 + angle, true);
    }

    // Dessin des secondes
    fixed_sec = now.getMilliseconds()/1000 + sec;
    angle = fixed_sec * Math.PI/30

    ctx.strokeStyle = "hsla(" + color + ", 50%, 50%, 1)"

    if (dot) {
        x = Math.cos(angle_0 + angle) * radius;
        y = Math.sin(angle_0 + angle) * radius;
        strokeCircle(x, y, lineWidth/4, 0, 2*Math.PI, true);
    } else {
        strokeCircle(0, 0, radius, angle_0, angle, true);
    }
    if (path) {
        ctx.strokeStyle = "hsla(" + (color + 32) + ", 50%, 50%, .2)"
        strokeCircle(0, 0, radius, angle_0, angle, false);
    }

    // restore last translate ..
    ctx.restore();
}

function strokeCircle(x,y,r,sAngle,eAngle,counterclockwise) {
    ctx.beginPath();
    ctx.arc(x,y,r,sAngle,eAngle,counterclockwise);
    ctx.stroke();
}

window.onload = init;

})();




