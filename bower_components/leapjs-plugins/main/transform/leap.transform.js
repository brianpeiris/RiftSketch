//CoffeeScript generated from main/transform/leap.transform.coffee
(function() {
  Leap.plugin('transform', function(scope) {
    var noop, transformDirections, transformMat4Implicit0, transformPositions, transformWithMatrices, _directionTransform;
    if (scope == null) {
      scope = {};
    }
    noop = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    _directionTransform = new THREE.Matrix4;
    if (scope.vr === true) {
      this.setOptimizeHMD(true);
      scope.quaternion = (new THREE.Quaternion).setFromRotationMatrix((new THREE.Matrix4).set(-1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 1));
      scope.scale = 0.001;
      scope.position = new THREE.Vector3(0, 0, -0.08);
    }
    if (scope.vr === 'desktop') {
      scope.scale = 0.001;
    }
    scope.getTransform = function(hand) {
      var matrix;
      if (scope.matrix) {
        matrix = typeof scope.matrix === 'function' ? scope.matrix(hand) : scope.matrix;
        if (window['THREE'] && matrix instanceof THREE.Matrix4) {
          return matrix.elements;
        } else {
          return matrix;
        }
      } else if (scope.position || scope.quaternion || scope.scale) {
        _directionTransform.set.apply(_directionTransform, noop);
        if (scope.quaternion) {
          _directionTransform.makeRotationFromQuaternion(typeof scope.quaternion === 'function' ? scope.quaternion(hand) : scope.quaternion);
        }
        if (scope.position) {
          _directionTransform.setPosition(typeof scope.position === 'function' ? scope.position(hand) : scope.position);
        }
        return _directionTransform.elements;
      } else {
        return noop;
      }
    };
    scope.getScale = function(hand) {
      if (!isNaN(scope.scale)) {
        scope.scale = new THREE.Vector3(scope.scale, scope.scale, scope.scale);
      }
      if (typeof scope.scale === 'function') {
        return scope.scale(hand);
      } else {
        return scope.scale;
      }
    };
    transformPositions = function(matrix, vec3s) {
      var vec3, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = vec3s.length; _i < _len; _i++) {
        vec3 = vec3s[_i];
        if (vec3) {
          _results.push(Leap.vec3.transformMat4(vec3, vec3, matrix));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    transformMat4Implicit0 = function(out, a, m) {
      var x, y, z;
      x = a[0];
      y = a[1];
      z = a[2];
      out[0] = m[0] * x + m[4] * y + m[8] * z;
      out[1] = m[1] * x + m[5] * y + m[9] * z;
      out[2] = m[2] * x + m[6] * y + m[10] * z;
      return out;
    };
    transformDirections = function(matrix, vec3s) {
      var vec3, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = vec3s.length; _i < _len; _i++) {
        vec3 = vec3s[_i];
        if (vec3) {
          _results.push(transformMat4Implicit0(vec3, vec3, matrix));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    transformWithMatrices = function(hand, transform, scale) {
      var finger, scalarScale, _i, _j, _len, _len1, _ref, _ref1;
      transformDirections(transform, [hand.direction, hand.palmNormal, hand.palmVelocity, hand.arm.basis[0], hand.arm.basis[1], hand.arm.basis[2]]);
      _ref = hand.fingers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        finger = _ref[_i];
        transformDirections(transform, [finger.direction, finger.metacarpal.basis[0], finger.metacarpal.basis[1], finger.metacarpal.basis[2], finger.proximal.basis[0], finger.proximal.basis[1], finger.proximal.basis[2], finger.medial.basis[0], finger.medial.basis[1], finger.medial.basis[2], finger.distal.basis[0], finger.distal.basis[1], finger.distal.basis[2]]);
      }
      Leap.glMatrix.mat4.scale(transform, transform, scale);
      transformPositions(transform, [hand.palmPosition, hand.stabilizedPalmPosition, hand.sphereCenter, hand.arm.nextJoint, hand.arm.prevJoint]);
      _ref1 = hand.fingers;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        finger = _ref1[_j];
        transformPositions(transform, [finger.carpPosition, finger.mcpPosition, finger.pipPosition, finger.dipPosition, finger.distal.nextJoint, finger.tipPosition]);
      }
      scalarScale = (scale[0] + scale[1] + scale[2]) / 3;
      return hand.arm.width *= scalarScale;
    };
    return {
      frame: function(frame) {
        var finger, hand, len, _i, _j, _len, _len1, _ref, _ref1, _results;
        if (!frame.valid || frame.data.transformed) {
          return;
        }
        frame.data.transformed = true;
        _ref = frame.hands;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          hand = _ref[_i];
          transformWithMatrices(hand, scope.getTransform(hand), (scope.getScale(hand) || new THREE.Vector3(1, 1, 1)).toArray());
          if (scope.effectiveParent) {
            transformWithMatrices(hand, scope.effectiveParent.matrixWorld.elements, scope.effectiveParent.scale.toArray());
          }
          len = null;
          _ref1 = hand.fingers;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            finger = _ref1[_j];
            len = Leap.vec3.create();
            Leap.vec3.sub(len, finger.mcpPosition, finger.carpPosition);
            finger.metacarpal.length = Leap.vec3.length(len);
            Leap.vec3.sub(len, finger.pipPosition, finger.mcpPosition);
            finger.proximal.length = Leap.vec3.length(len);
            Leap.vec3.sub(len, finger.dipPosition, finger.pipPosition);
            finger.medial.length = Leap.vec3.length(len);
            Leap.vec3.sub(len, finger.tipPosition, finger.dipPosition);
            finger.distal.length = Leap.vec3.length(len);
          }
          Leap.vec3.sub(len, hand.arm.prevJoint, hand.arm.nextJoint);
          _results.push(hand.arm.length = Leap.vec3.length(len));
        }
        return _results;
      }
    };
  });

}).call(this);
