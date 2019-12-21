/* global Boid */
const t3 = THREE;

const light = new t3.PointLight();
light.position.set(0, 1, 0);
scene.add(light);

scene.add(new t3.AmbientLight(0xaaaaaa));

const makeCube = function() {
  const cube = new t3.Mesh(new t3.BoxGeometry(1, 1, 1), new t3.MeshLambertMaterial({ color: "red" }));
  cube.position.set(1, 1, 1);
  scene.add(cube);
  return cube;
};

const Watch = function(obj, name) {
  this.canvasSize = 128;
  const canvas = document.createElement("canvas");
  canvas.width = this.canvasSize;
  canvas.height = this.canvasSize / 2;

  document.body.append(canvas);

  this.context = canvas.getContext("2d");
  this.context.font = "40px Ubuntu Mono, monospace";
  this.textTexture = new THREE.Texture(canvas);
  this.textTexture.needsUpdate = true;
  const textAreaMat = new THREE.MeshBasicMaterial({ map: this.textTexture, side: THREE.DoubleSide });

  const watch = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 0.5), new THREE.MeshBasicMaterial(textAreaMat));
  watch.rotation.y = Math.PI;

  scene.add(watch);

  this.update = function() {
    this.context.clearRect(0, 0, this.canvasSize, this.canvasSize);
    this.context.fillStyle = "white";
    this.context.fillRect(0, 0, this.canvasSize, this.canvasSize);
    this.context.fillStyle = "black";
    this.context.fillText(obj[name], 0, 40);
    this.textTexture.needsUpdate = true;
  };
};

const world = {
  boids: []
};
const numBoids = 10;

const positions = [
  new t3.Vector3(0.0, 1.6, -1.6),
  new t3.Vector3(0.1, 1.5, -1.6),
  new t3.Vector3(0.7, 1.8, -1.8),
  new t3.Vector3(0.4, 1.6, -1.6),
  new t3.Vector3(-0.4, 1.3, -2.0),
  new t3.Vector3(0.0, 1.3, -1.2),
  new t3.Vector3(-0.2, 1.2, -1.6),
  new t3.Vector3(0.0, 1.4, -2.6),
  new t3.Vector3(0.0, 1.6, -2.6),
  new t3.Vector3(0.6, 1.2, -1.6)
];

makeCube();

for (let i = 0; i < numBoids; i++) {
  const boid = new Boid(world);
  boid.obj.position.copy(positions[i]);
  boid.visual.material.color.setHSL(i / 10, 1, 0.5);
  world.boids.push(boid);
}

const watch = new Watch(world.boids[0].obj.position, "x");

sketch.loop = () => {
  for (let i = 0; i < numBoids; i++) {
    const boid = world.boids[i];
    boid.step();
  }
  watch.update();
};
