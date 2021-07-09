// noprotect

var flock;

var debug = false;

var sAlign;
var sSeparate;
var sCohesion;
var sMaxSpeed;
var sMaxForce;
var sSize;

var pAlign;
var pSeparate;
var pCohesion;
var pMaxSpeed;
var pMaxForce;
var pSize;

function setup() {
  createCanvas(640, 480);
  flock = new Flock();

  for (var i = 0; i < 100; i++) {
    flock.addBoid(new Vehicle(random(width), random(height)));
  }

  createP('Click and drag on the screen to add vehicles');

  var clearButton = createButton('Clear Planes');
  clearButton.mousePressed(clearPlanes);

  createP('');

  var debugButton = createButton('Toggle Debug');
  debugButton.mousePressed(toggleDebug);

  pAlign = createP("Alignment Force: 1");
  sAlign = createSlider(0, 100, 1);

  pSeparate = createP("Separation Force: 1");
  sSeparate = createSlider(0, 5, 1, 0.5);

  pCohesion = createP("Cohesion Force: 1");
  sCohesion = createSlider(0, 2, 1, 0.25);

  pMaxSpeed = createP("Max Speed: 4");
  sMaxSpeed = createSlider(0, 10, 4);

  pMaxForce = createP("Max Force: 0.1");
  sMaxForce = createSlider(0, 1, 0.1, 0.1);
  
  pSize = createP("Size: 3");
  sSize = createSlider(0, 10, 3, 1);

}

function draw() {
  background(99);

  pAlign.html('Alignment Force: ' + sAlign.value());
  pSeparate.html('Separation Force: ' + sSeparate.value());
  pCohesion.html('Cohesion Force: ' + sCohesion.value());
  pMaxSpeed.html('Max Speed: ' + sMaxSpeed.value());
  pMaxForce.html('Max Force: ' + sMaxForce.value());
  pSize.html('Size: ' + sSize.value());

  flock.run();

}

function clearPlanes() {
  flock = new Flock();
}

function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    flock.addBoid(new Vehicle(mouseX, mouseY));
  }
}



function mouseDragged() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    flock.addBoid(new Vehicle(mouseX, mouseY));
  }
}

function toggleDebug() {
  debug = !debug;
}