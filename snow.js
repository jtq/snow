var Snow = function(numFlakes) {
  this.container = null;
  this.gravity = { x: 0, y: 1 };
  this.snowColour = "#ffffff";

  this.flakes = [];
  this.numFlakes = 0;
  this.maxFlakeSize = 6;
  this.minFlakeSize = 2;

  this.settle = {
    chance: 20, // 1 in X chance of snow settling on a block
    maxDepth: 5
  };

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

    for(var i=0; i<this.flakes.length; i++) {
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

          flake.reset();
          flake.x = Math.floor(Math.random()*this.container.offsetWidth);

          if(Math.floor(Math.random()*this.settle.chance) == 0) {
            this.settleSnow(obj);
          }
        }
      }

      if(flake.y > this.container.offsetHeight) {
        flake.reset();
      }

      if(flake.x > this.container.offsetWidth) {
        flake.reset();
      }

      flake.lastMoved = now;
    }

  };

  this.render = function() {
    for(var i=0; i<this.flakes.length; i++) {
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
    for(var i=0; i<this.flakes.length; i++) {
      var flake = this.flakes[i];
      flake.lastMoved = null;
    }
  };

  this.settleSnow = function(element) {
    if(!element.snowCover) {
      element.snowCover = document.createElement("div");
      element.snowCover.className = "snow settled";
      element.snowCover.style.width = element.offsetWidth + "px";
      element.snowCover.style.height = "0px";
      element.snowCover.style.left = element.offsetLeft+ "px";
      element.snowCover.style.top = element.offsetTop+ "px";
      element.snowCover.style.boxShadow = "0px 0px 0px 0px #ffffff";
      this.container.appendChild(element.snowCover);

      var self = this;

      var onClickHandler = function() {
        var snowDepth = parseInt(element.snowCover.style.height, 10) || 1;
        var numNewFlakes = parseInt(element.offsetWidth / (snowDepth+2));
        for(var i=0; i<numNewFlakes; i++) {
          self.flakes.push(new Flake(self.container, 7, snowDepth, element.offsetLeft+(i*(snowDepth+2))+Math.floor(Math.random()*10), element.offsetTop));
        }
        self.container.removeChild(element.snowCover);
        delete(element.snowCover);
        element.removeEventListener("click", onClickHandler);
      };
      element.addEventListener("click", onClickHandler);

    }
    else {
      var matches = element.snowCover.style.boxShadow.match(/0px 0px (\d+px) (\d+px)/);

      var blur = parseInt(matches && matches[1], 10) || 0;
      var spread = parseInt(matches && matches[2], 10) || 0;

      var height = parseInt(element.snowCover.style.height, 10);

      if(blur < 3 && spread < 3) {
        element.snowCover.style.boxShadow = "0px 0px " + (blur+1) + "px " + (spread+1) + "px #ffffff";
      }
      else if(height < this.settle.maxDepth) {
        element.snowCover.style.height = (height + 1) + "px";
      }
    }

  };

  var Flake = function(container, speed, size, x, y) {
    this.size = size || 2;
    this.x = null;
    this.y = null;
    this.lastMoved = null;
    this.speed = speed || 16;   /* Nice looking flake speeds are approximately 13ms per pixel to 20ms per pixel */
    this.container = container;

    this.reset(x, y);

    this.element = document.createElement("div");
    this.element.style.width = this.element.style.height = size + "px";
    this.element.style.borderRadius = Math.ceil(size/2) + "px";

    this.element.className = "snow flake";
    container.appendChild(this.element);
  };

  Flake.prototype.reset = function(x, y) {
    this.x = x || Math.floor((Math.random()*this.container.offsetWidth*3) - this.container.offsetWidth); // Plot more snowflakes than can fit on screen, in case of sideways velocity
    this.y = y || -(Math.floor(Math.random()*this.container.offsetHeight)+10);  // Plot snowflakes up to "-screenheight" above viewable area, to ensure an even mix and prevent clumping when starting large numbers or flakes at once
    this.lastMoved = null;
  };

  var Util = function() {};
  Util.getCssHexColour = function(cssValue) {
    var matches = null;
    if(matches = cssValue.match(/^(#\d{1,6})$/)) {
      return matches[0];
    }
    else if(matches = cssValue.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/)) {
      var hex = function(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
      };
      return "#" + hex(matches[1]) + hex(matches[2]) + hex(matches[3]);
    }
  };
};