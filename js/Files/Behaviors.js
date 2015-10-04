var flockingBehavior = function (
  boid, world, hands
) {
  var closestBoids = [];

  var getLookAtQuaternion = function (otherBoid) {
    var q = new t3.Quaternion();
    q.copy(boid.obj.quaternion);
    var m1 = new t3.Matrix4();
    m1.lookAt(
      otherBoid.obj.position,
      boid.obj.position,
      boid.obj.up);
    q.setFromRotationMatrix(m1);
    return q;
  };

  var separate = function (otherBoid) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position) < 0.1
    ) { return; }
    var q = getLookAtQuaternion(
      otherBoid);
    q.conjugate();

    var SEPARATION = 0.1;

    boid.obj.quaternion.slerp(
      q, SEPARATION
    );
  };

  var align = function (otherBoid) {
    boid.obj.quaternion.slerp(
      otherBoid.obj.quaternion, 0.01
    );
  };

  var adhere = function (otherBoid) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position) > 0.2
    ) { return; }
    var q = getLookAtQuaternion(otherBoid);
    boid.obj.quaternion.slerp(
      q, 0.005
    );
  };

  var attractTo = function (hands) {
    var hand = hands[0] || hands[1];
    if (!hand) { return; }
    var q = getLookAtQuaternion({obj: {position: hand}});
    boid.obj.quaternion.slerp(
      q, 0.05
    );
  };

  world.boids.forEach(function (otherBoid) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position) < 0.5
    ) {
      separate(otherBoid);
      align(otherBoid);
      adhere(otherBoid);
      if (hands) {
        attractTo(hands);
      }
    }
  });
};

var moveBehavior = function (boid) {
  boid.obj.translateZ(0.05);
};

var returnToOrigin = function (boid) {
  if (boid.obj.position.distanceTo(scene.position) > 4) {
    boid.obj.lookAt(scene.position);
  }
};
