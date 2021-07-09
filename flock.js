function Flock() {
  this.boids = [];

  this.run = function() {
    for (var i = 0; i < this.boids.length; i++) {
      this.boids[i].alignForceWeight = sAlign.value();
      this.boids[i].separateForceWeight = sSeparate.value();
      this.boids[i].cohesionForceWeight = sCohesion.value();
      this.boids[i].maxSpeed = sMaxSpeed.value(); 
      this.boids[i].maxForce = sMaxForce.value(); 
      this.boids[i].r = sSize.value(); 
      this.boids[i].applyBehaviors(this.boids);
      this.boids[i].run();
    }
  }

  this.addBoid = function(boid) {
    this.boids.push(boid);
  }
}