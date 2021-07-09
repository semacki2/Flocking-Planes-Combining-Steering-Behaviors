function Vehicle(x, y) {
  this.loc = createVector(x, y);
  this.vel = createVector(random(-3, 3), random(-3, 3));
  this.acc = createVector(0, 0);


  this.r = 4;
  this.mass = 1;

  this.alignForceWeight = 1;
  this.separateForceWeight = 1;
  this.cohesionForceWeight = 1;
  this.maxSpeed = 4; //the faster it will move
  this.maxForce = 0.1; //bigger the number, the faster it will turn.

  this.lineOfSight = 25;
  this.safeSpace = this.r * 5;

  this.update = function() {
    //update velocity
    this.vel.add(this.acc);

    //limit velocity
    this.vel.limit(this.maxSpeed);

    //update location
    this.loc.add(this.vel);

    //reset acceleration
    this.acc.mult(0);

  }

  this.applyForce = function(force) {
    var newAcc = force.div(this.mass);
    this.acc.add(newAcc);
  }

  this.seek = function(target) {
    //desired is the vector towards the target. Straight line to the target
    var desired = p5.Vector.sub(target, this.loc);

    var distance = desired.mag();

    //if close to the target, slow down. otherwise go at max speed
    if (distance < 10) {
      var newSpeed = map(distance, 0, 100, 1, this.maxSpeed);
      desired.setMag(newSpeed);
    } else {
      desired.setMag(this.maxSpeed);
    }

    //steering is "desired" vector - current velocity
    var steering = p5.Vector.sub(desired, this.vel);
    steering.limit(this.maxForce);

    //apply the steering vector as a force to rotate the vehicle
    //this.applyForce(steering);
    return steering;
  }

  //vehicle follows the vector of the flow field at its current location
  this.follow = function(path) {

    var predict = this.vel.copy();
    predict.setMag(50);

    var predictLocation = p5.Vector.add(this.loc, predict);

    //look at the path
    //set a high record and we will try to find the shortest point
    //find all normal points to the path, then find the closest one.
    var worldRecord = width * height;

    var normal;
    var target;

    //look at all line segments in the path

    for (var i = 0; i < path.points.length - 1; i++) {
      var segmentBegin = path.points[i].copy();
      var segmentEnd = path.points[i + 1].copy();

      //get the normal point to that line. (shortest distance)
      var normalPoint = this.getNormalPoint(predictLocation, segmentBegin, segmentEnd);

      //if the normal point is outside of the line segment, set the normal point to the be the end point of the segment.
      if (normalPoint.x < segmentBegin.x || normalPoint.x > segmentEnd.x) {
        normalPoint = segmentEnd.copy();
      }

      //how far away are we from the path?
      var distance = p5.Vector.dist(predictLocation, normalPoint);


      if (distance < worldRecord) {
        worldRecord = distance;
        normal = normalPoint.copy();

        //find target point a little further ahead of normal point.
        var dir = p5.Vector.sub(segmentEnd, segmentBegin);
        dir.normalize();
        dir.mult(10); //arbitrary lenght ahead of normal point.
        target = normal.copy();
        target.add(dir);
      }
    }

    if (worldRecord > path.radius) {
      this.seek(target);
    }

    // Draw the debugging stuff
    if (debug) {
      // Draw predicted future position
      stroke(0);
      fill(0, 0, 255);
      line(this.loc.x, this.loc.y, this.loc.x, this.loc.y);
      ellipse(predictLocation.x, predictLocation.y, 4, 4);

      // Draw normal position
      stroke(0);
      fill(0, 255, 0);
      ellipse(normal.x, normal.y, 4, 4);
      // Draw actual target (red if steering towards it)
      line(predictLocation.x, predictLocation.y, normal.x, normal.y);
      if (worldRecord > path.radius) {
        fill(255, 0, 0);
      } else {
        fill(0);
      }
      noStroke();
      ellipse(target.x, target.y, 8, 8);
    }
  }

  this.getNormalPoint = function(predictLocation, pathBegin, pathEnd) {
    //vector from pathBegin to predictLocation
    var vBeginToPredict = p5.Vector.sub(predictLocation, pathBegin);

    //vector from pathBegin to pathEnd
    var vBeginToEnd = p5.Vector.sub(pathEnd, pathBegin);

    var projection = vBeginToEnd.copy();

    //normalize begin to end
    projection.normalize();

    //Project the scalar difference onto the path using the dot product
    projection.mult(vBeginToPredict.dot(projection));

    //find normal point
    var normalPoint = p5.Vector.add(pathBegin, projection);
    return normalPoint.copy();
  }

  this.align = function(group) {
    var sum = createVector(0, 0);
    var count = 0;

    for (var i = 0; i < group.length; i++) {
      var d = p5.Vector.dist(this.loc, group[i].loc);

      if (d > 0 && d < this.lineOfSight + (this.r + group[i].r)) {
        sum.add(group[i].vel);
        if (debug) {
          stroke(0);
          strokeWeight(1);
          line(this.loc.x, this.loc.y, group[i].loc.x, group[i].loc.y);
        }
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);
      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      this.applyForce(steer);
    }
  }

  this.separate = function(group) {
    var sum = createVector(0, 0);
    var count = 0;

    for (var i = 0; i < group.length; i++) {
      var other = group[i];
      var d = p5.Vector.dist(this.loc, other.loc);

      if (d > 0 && d < this.safeSpace) {
        var diff = p5.Vector.sub(this.loc, other.loc);
        diff.normalize();
        diff.div(d); //weight by distance. things that are farther away will impact you less.
        sum.add(diff);
        count++;
        if (debug) {
          stroke(0);
          strokeWeight(1);
          line(this.loc.x, this.loc.y, other.loc.x, other.loc.y);
        }
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);
      var steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      //this.applyForce(steer);
      return steer;
    } else {
      return createVector(0, 0);
    }
    
  }

  // Cohesion
  // For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position

  this.cohesion = function(group) {
    var sum = createVector(0, 0);
    var count = 0;

    for (var i = 0; i < group.length; i++) {
      var other = group[i];
      var d = p5.Vector.dist(this.loc, other.loc);

      if (d > 0 && d < this.lineOfSight) {
        sum.add(other.loc);
        count++;
      }
    }
    if (count > 0) {
      var center = sum.div(count);
      cohesionForce = this.seek(center);
      return cohesionForce;
    } else {
      return createVector(0, 0);
    }
  }

  this.applyBehaviors = function(group) {
    var separateForce = this.separate(group);
    var alignForce = this.align(group);
    var cohesionForce = this.cohesion(group);

    if (separateForce) {
      separateForce.mult(this.separateForceWeight);
      this.applyForce(separateForce);

    }

    if (alignForce) {
      alignForce.mult(this.alignForceWeight);
      this.applyForce(alignForce);
    }

    if (cohesionForce) {
      cohesionForce.mult(this.cohesionForceWeight);
      this.applyForce(cohesionForce);
    }
  }

  this.borders = function() {
    if (this.loc.x < this.r * -1) {
      this.loc.x = width + this.r;
    }

    if (this.loc.y < this.r * -1) {
      this.loc.y = height + this.r;
    }

    if (this.loc.x > width + this.r) {
      this.loc.x = -1 * this.r;
    }

    if (this.loc.y > height + this.r) {
      this.loc.y = -1 * this.r;
    }
  }

  this.displayCircle = function() {

    fill(127, 100);
    stroke(0);
    strokeWeight(1);
    ellipse(this.loc.x, this.loc.y, this.r * 2);

  }

  this.displayAirplane = function() {
    // draw a triangle rotated in the direction of velocity
    var theta = this.vel.heading() + (PI / 2);
    fill(225);
    noStroke();
    push();
    translate(this.loc.x, this.loc.y);
    rotate(theta);
    beginShape();
    vertex(0, this.r * -2);
    vertex(-1 * this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();

  }

  this.run = function() {
    this.update();
    this.borders();
    this.displayAirplane();
  }
}