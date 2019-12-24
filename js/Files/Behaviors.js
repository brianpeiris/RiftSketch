/* global t3 */
/* exported flockingBehavior, moveBehavior, returnToOrigin */
const flockingBehavior = function(
  boid,
  world,
  hands
) {
  const getLookAtQuaternion = function(
    otherBoid
  ) {
    const q = new t3.Quaternion();
    q.copy(boid.obj.quaternion);
    const m1 = new t3.Matrix4();
    m1.lookAt(
      otherBoid.obj.position,
      boid.obj.position,
      boid.obj.up
    );
    q.setFromRotationMatrix(m1);
    return q;
  };

  const separate = function(otherBoid) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position
      ) < 0.1
    ) {
      return;
    }
    const q = getLookAtQuaternion(
      otherBoid
    );
    q.conjugate();

    const SEPARATION = 0.1;

    boid.obj.quaternion.slerp(
      q,
      SEPARATION
    );
  };

  const align = function(otherBoid) {
    boid.obj.quaternion.slerp(
      otherBoid.obj.quaternion,
      0.01
    );
  };

  const adhere = function(otherBoid) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position
      ) > 0.2
    ) {
      return;
    }
    const q = getLookAtQuaternion(
      otherBoid
    );
    boid.obj.quaternion.slerp(q, 0.005);
  };

  const attractTo = function(hands) {
    const hand = hands[0] || hands[1];
    if (!hand) {
      return;
    }
    const q = getLookAtQuaternion({
      obj: { position: hand }
    });
    boid.obj.quaternion.slerp(q, 0.05);
  };

  world.boids.forEach(function(
    otherBoid
  ) {
    if (
      otherBoid.obj.position.distanceTo(
        boid.obj.position
      ) < 0.5
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

const moveBehavior = function(boid) {
  boid.obj.translateZ(0.05);
};

const returnToOrigin = function(boid) {
  if (
    boid.obj.position.distanceTo(
      scene.position
    ) > 4
  ) {
    boid.obj.lookAt(scene.position);
  }
};
