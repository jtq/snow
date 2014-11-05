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
      element.snowCover = this.createSnow(element.offsetWidth, 0, element.offsetLeft, element.offsetTop, "0px 0px");
      this.container.appendChild(element.snowCover);

      var self = this;

      var onClickHandler = function() {
        var snowDepth = parseInt(element.snowCover.style.height, 10) || 1;
        var numClumps = Math.floor(Math.random()*4)+2;  // Generate between 2 and 5 clumps
        var clumpWidths = [];
        var baseClumpWidth = element.offsetWidth / numClumps;
        for(var i=0; i<numClumps; i++) {  // Set basic clump widths
          clumpWidths.push(baseClumpWidth);
        }
        for(var i=0; i<numClumps-1; i++) {  // For each clump except the last, randomly increase or decrease the width of that clump (and adjust the following adjoining clump apropriately)
          var variation = Math.floor((Math.random()*clumpWidths[i])-(clumpWidths[i]/2)); // Randomly add or remove up to half the basic width from this clump
          clumpWidths[i] += variation;
          clumpWidths[i+1] -= variation;
        }

        var clumps = [];

        var pos = element.offsetLeft;
        for(var j=0; j<numClumps; j++) {
          var gap = (j == numClumps-1)? 0 : Math.floor(Math.random()*4)+2;  // 2-5 pixel gap between clumps
          var snowClump = self.createSnow(clumpWidths[j]-gap, snowDepth, pos, element.offsetTop, element.snowCover.style.boxShadow);
          clumps.push(snowClump);
          self.container.appendChild(snowClump);
          pos += clumpWidths[j];
        }

        requestAnimationFrame(function() {
          for(var k=0; k<clumps.length; k++) {
            var clump = clumps[k];
            var vHeight = self.container.offsetHeight - clump.offsetTop + 50;
            var xDrift = Math.floor(Math.random()*5)-2;
            var rotation = Math.floor(Math.random()*21)-20;
            /* A nice-looking fall-time is about 1000 pixels per second with an ease-in function to simulate gravitational acceleration
            so let's work out what fraction of 1000 the available fall-distance is, and adjust the transition-timing accordingly.
             */
            var fallTime = (vHeight / 1000) * 1;
            clump.style.transition = "transform "+fallTime+"s ease-in 0.1s, height 0.1s ease-out 0s, opacity 0.1s";
            clump.style.transform = "translate("+xDrift+"px, "+vHeight+"px) rotate("+rotation+"deg)";
            clump.style.height = (parseInt(clump.style.height, 10)+5) + "px";
            clump.style.opacity = "0.9";
            clump.addEventListener("transitionend", function (e) {
              if(e.propertyName === "transform") {
                var thisClump = e.target || e.srcElement;
                thisClump.parentNode.removeChild(thisClump);
              }
            });
          }
        });

        self.container.removeChild(element.snowCover);
        delete(element.snowCover);
        element.removeEventListener("click", onClickHandler);
      };

      if(element.className.match("snow-disturbable")) {
        element.addEventListener("click", onClickHandler);
      }

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

  this.createSnow = function(width, height, left, top, boxShadow) {
    var element = document.createElement("div");
    element.className = "snow settled";
    element.style.width = width + "px";
    element.style.height = height + "px";
    element.style.left = left + "px";
    element.style.top = top + "px";
    element.style.boxShadow = boxShadow;

    return element;
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