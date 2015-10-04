
var Boid = function (world) {
  this.world = world;
  this.behaviors = [
    moveBehavior,
    flockingBehavior,
    returnToOrigin
  ];
  var color = new t3.Color();
  color.setHSL(Math.random(), 1, 0.5);
  this.visual = new t3.Mesh(
    new t3.TetrahedronGeometry(0.06, 0),
    new t3.MeshLambertMaterial({color: color})
  );
  this.visual.quaternion.set(
    0.2798, -0.3648, -0.1163, 0.8804);

  var boid = new t3.Object3D();
  boid.add(this.visual);
  boid.scale.setZ(2.5);
  boid.scale.multiplyScalar(1);
  scene.add(boid);
  this.obj = boid;
};
Boid.prototype.step = function (hands) {
  this.behaviors.forEach(function (behavior) {
    behavior(this, this.world, hands);
  }.bind(this));
};


