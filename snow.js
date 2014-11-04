var Snow = function(numFlakes) {
  this.container = null;
  this.gravity = { x: 0, y: 1 };

  this.flakes = [];
  this.numFlakes = 0;
  this.maxFlakeSize = 6;
  this.minFlakeSize = 2;

  this.settleChance = 10; // 1 in X chance of snow settling on a block

  this.timer = null;

  this.init = function(containerId, numFlakes) {
    this.container = document.getElementById(containerId || "snow-container");
    this.numFlakes = numFlakes || 1000;

    for(var i=0; i<this.numFlakes; i++) {
      var size = Math.floor(Math.random()*(this.maxFlakeSize-this.minFlakeSize))+this.minFlakeSize;
      //var speed = Math.floor(Math.random()*(20-12))+13; // Random speed between 13 and 20ms
      var speed = ((((this.maxFlakeSize - this.minFlakeSize) - (size - this.minFlakeSize)) / (this.maxFlakeSize - this.minFlakeSize)) * (20-13)) + 13;  // Proportional to flake size (larger flakes fall faster)
      this.flakes.push(new Flake(this.container, speed, size));
    }
  };

  this.move = function() {
    var now = new Date().getTime(); // Capture current duration into the fall, so we know how far the flake should be moved

    for(var i=0; i<this.numFlakes; i++) {
      var flake = this.flakes[i];

      if(flake.lastMoved == null) {
        flake.lastMoved = now;
      }

      var timeSinceLastMove = now - flake.lastMoved;

      flake.x += this.gravity.x * (timeSinceLastMove / flake.speed);
      flake.y += this.gravity.y * (timeSinceLastMove / flake.speed);

      var physicsTargets = document.querySelectorAll(".physics-target");
      for(var j=0; j<physicsTargets.length; j++) {
        var obj = physicsTargets[j];
        if(obj.offsetTop > flake.y && obj.offsetTop < (flake.y+flake.size) &&
           obj.offsetLeft < flake.x && (obj.offsetLeft+obj.offsetWidth) > (flake.x+flake.size)) {

          flake.restart = true;

          if(Math.floor(Math.random()*this.settleChance) == 0) {
            obj.style.borderTopColor = "#ffffff";
            var borderTopWidth = (parseInt(obj.style.borderTopWidth, 10) || 0);
            if(borderTopWidth < 5) {
              borderTopWidth++;
              obj.style.borderTopWidth = borderTopWidth + "px";
              obj.style.borderTopLeftRadius = obj.style.borderTopRightRadius = borderTopWidth + "px";

              obj.style.position = "relative";
              obj.style.marginTop = "-" + borderTopWidth + "px";
            }
          }
        }
      }

      if(flake.y > this.container.offsetHeight) {
        flake.restart = true;
      }

      if(flake.restart) {
        flake.y = -(Math.floor(Math.random()*this.container.offsetHeight)+10);
        flake.x = Math.floor(Math.random()*this.container.offsetWidth);
        flake.restart = false;
      }

      flake.lastMoved = now;
    }

  };

  this.render = function() {
    for(var i=0; i<this.numFlakes; i++) {
      var flake = this.flakes[i];
      flake.element.style.transform = "translate("+flake.x+"px, "+flake.y+"px)";
    }
  };

  this.start = function() {
    var self = this;

    var step = function() {
      self.timer = window.requestAnimationFrame(step);
      self.move();
      self.render();
    };

    step();
  };

  this.stop = function() {
    window.cancelAnimationFrame(this.timer);
  };

  var Flake = function(container, speed, size, x, y) {
    this.size = size || 2;
    this.x = x || Math.floor(Math.random()*container.offsetWidth);
    this.y = y || -(Math.floor(Math.random()*container.offsetHeight)+10);
    this.lastMoved = null;
    this.speed = speed || 16;   /* Nice looking flake speeds are approximately 13ms per pixel to 20ms per pixel */
    this.restart = false;

    this.element = document.createElement("div");
    this.element.style.width = this.element.style.height = size + "px";
    this.element.style.borderRadius = Math.ceil(size/2) + "px";

    this.element.className = "snow-flake";
    container.appendChild(this.element);
  };
};