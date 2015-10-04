var t3 = THREE;

var light = new t3.PointLight();
light.position.set(0, 1, 0);
scene.add(light);

scene.add(new t3.AmbientLight(0xaaaaaa));

var makeCube = function () {
  var cube = new t3.Mesh(
    new t3.BoxGeometry(1, 1, 1),
    new t3.MeshLambertMaterial({color: 'red'})
  );
  cube.position.set(1, 1, 1);
  scene.add(cube);
  return cube;
};

var Watch = function (obj, name) {
  this.canvasSize = 200;
  var canvas = document.createElement('canvas');
  canvas.width = this.canvasSize;
  canvas.height = this.canvasSize / 2;

  this.context = canvas.getContext('2d');
  this.context.font = '40px Inconsolata,monospace';
  // this.context.globalCompositeOperation = 'darker';
  this.textTexture = new THREE.Texture(canvas);
  this.textTexture.needsUpdate = true;
  var textAreaMat = new THREE.MeshBasicMaterial(
    {map: this.textTexture, side: THREE.DoubleSide});

  var watch = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 0.5),
    new THREE.MeshBasicMaterial(textAreaMat));
  watch.rotation.y = Math.PI;

  scene.add(watch);

  this.update = function () {
    this.context.clearRect(0, 0, this.canvasSize, this.canvasSize);
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvasSize, this.canvasSize);
    this.context.fillStyle = 'black';
    this.context.fillText(obj[name], 0, 40);
    this.textTexture.needsUpdate = true;
  };
};

var world = {
  boids: []
};
var numBoids = 10;

var positions = [
  new t3.Vector3(0.00, 1.60, -1.60),
  new t3.Vector3(0.10, 1.50, -1.60),
  new t3.Vector3(0.70, 1.80, -1.80),
  new t3.Vector3(0.40, 1.60, -1.60),
  new t3.Vector3(-0.40, 1.30, -2.00),
  new t3.Vector3(0.00, 1.30, -1.20),
  new t3.Vector3(-0.20, 1.20, -1.60),
  new t3.Vector3(0.00, 1.40, -2.60),
  new t3.Vector3(0.00, 1.60, -2.60),
  new t3.Vector3(0.60, 1.20, -1.60)
];

for (var i = 0; i < numBoids; i++) {
  var boid =  new Boid(world);
  boid.obj.position.copy(positions[i]);
  boid.visual.material.color.setHSL(i / 10, 1, 0.5);
  world.boids.push(boid);
}

return function loop () {
  for (var i = 0; i < numBoids; i++) {
    var boid = world.boids[i];
    if (typeof hands !== 'undefined') {
      boid.step(hands);
    }
    else {
      boid.step();
    }
  }
};
