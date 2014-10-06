var RiftSandbox = (function () {
'use strict';

var constr = function (width, height) {
  this.width = width;
  this.height = height;
  window.HMDRotation = this.HMDRotation = new THREE.Quaternion();
  this.HMDPosition = new THREE.Vector3();
  this.BaseRotation = new THREE.Quaternion();
  this.BaseRotationEuler = new THREE.Euler(0, Math.PI);
  this.scene = null;
  this.sceneStuff = [];
  this.cameraLeft = null;
  this.cameraRight = null;
  this.renderer = null;
  this.cssCamera = document.getElementById('camera');
  this.initWebGL();
  this.vrMode = false;
};

constr.prototype.initScene = function () {
  // create scene
  this.scene = new THREE.Scene();

  this.camera = new THREE.PerspectiveCamera(
    75, this.width / this.height, 0.1, 1000 );
  this.camera.useQuaternion = true;

  this.cameraPivot = new THREE.Object3D();
  this.cameraPivot.useQuaternion = true;
  this.scene.add(this.cameraPivot);

  this.cameraLeft = new THREE.PerspectiveCamera(75, 4/3, 0.1, 1000);
  this.cameraPivot.add( this.cameraLeft );

  this.cameraRight = new THREE.PerspectiveCamera(75, 4/3, 0.1, 1000);
  this.cameraPivot.add( this.cameraRight );

  // TODO: Refactor to reduce repetition.

  // Add projection sphere
  var sphereTexture = THREE.ImageUtils.loadTexture('img/placeholder.png');
  sphereTexture.wrapS = sphereTexture.wrapT = THREE.RepeatWrapping;
  sphereTexture.repeat.set( 4, 4 );
  var projSphere = new THREE.Mesh(
    new THREE.SphereGeometry( 5000, 60, 40 ),
    new THREE.MeshBasicMaterial({ map: sphereTexture, side: THREE.DoubleSide}) );
  // TODO: Is this necessary?
  projSphere.useQuaternion = true;
  this.scene.add( projSphere );

  var planeTexture = THREE.ImageUtils.loadTexture('img/placeholder.png');
  planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
  planeTexture.repeat.set( 40, 40 );
  var plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 5000, 5000 ),
    new THREE.MeshBasicMaterial({ map: planeTexture, side: THREE.DoubleSide}) );
  // TODO: Is this necessary?
  plane.rotation.x = Math.PI / 2;
  // TODO: We should move the camera to human height instead of moving the floor.
  plane.position.y = -100;
  this.scene.add( plane );

  var oldAdd = this.scene.add, that = this;
  this.scene.add = function (obj) {
    that.sceneStuff.push(obj);
    oldAdd.call(that.scene, obj);
  };
};

constr.prototype.setCameraOffsets = function (eyeOffsetLeft, eyeOffsetRight) {
  this.cameraLeft.position.sub(eyeOffsetLeft);
  this.cameraRight.position.sub(eyeOffsetRight);
};

function perspectiveMatrixFromVRFieldOfView(fov, zNear, zFar) {
  var outMat = new THREE.Matrix4();
  var out = outMat.elements;
  var upTan = Math.tan(fov.upDegrees * Math.PI/180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI/180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0);

  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);

  out[0] = xScale;
  out[4] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[12] = 0.0;

  out[1] = 0.0;
  out[5] = yScale;
  out[9] = ((upTan - downTan) * yScale * 0.5);
  out[13] = 0.0;

  out[2] = 0.0;
  out[6] = 0.0;
  out[10] = zFar / (zNear - zFar);
  out[14] = (zFar * zNear) / (zNear - zFar);

  out[3] = 0.0;
  out[7] = 0.0;
  out[11] = -1.0;
  out[15] = 0.0;

  return outMat;
}

constr.prototype.setFOV = function (fovLeft, fovRight) {
  var leftProjectionMatrix = perspectiveMatrixFromVRFieldOfView(
    fovLeft, 0.1, 1000);
  var rightProjectionMatrix = perspectiveMatrixFromVRFieldOfView(
    fovRight, 0.1, 1000);
  this.cameraLeft.projectionMatrix = leftProjectionMatrix;
  this.cameraRight.projectionMatrix = rightProjectionMatrix;
};

// Utility function
function angleRangeDeg(angle) {
  while (angle >= 360) angle -=360;
  while (angle < 0) angle +=360;
  return angle;
}

function angleRangeRad(angle) {
  while (angle > Math.PI) angle -= 2*Math.PI;
  while (angle <= -Math.PI) angle += 2*Math.PI;
  return angle;
}

function deltaAngleDeg(a,b) {
  return Math.min(360-(Math.abs(a-b)%360),Math.abs(a-b)%360);
}

constr.prototype.setBaseRotation = function () {
  this.BaseRotationEuler.set(
    angleRangeRad(this.BaseRotationEuler.x),
    angleRangeRad(this.BaseRotationEuler.y), 0.0 );
  this.BaseRotation.setFromEuler(this.BaseRotationEuler, 'YZX');
};

constr.prototype.initWebGL = function () {
  this.initScene();

  try {
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('viewer'),
      preserveDrawingBuffer: true});
  }
  catch(e){
    console.log(e);
    alert('This application needs WebGL enabled!');
    return false;
  }

  this.renderer.setClearColor(0x202020, 1.0);
  //this.renderer.autoClearColor = false;
  this.renderer.setSize( this.width, this.width );

  this.container = document.getElementById('container');
};

constr.prototype.clearScene = function () {
  for (var i = 0; i < this.sceneStuff.length; i++) {
    this.scene.remove(this.sceneStuff[i]);
  }
  this.sceneStuff = [];
};

constr.prototype.render = function () {
  var
    halfWidth = this.width / 2,
    halfHeight = this.height / 2;

  if (this.vrMode) {
    this.renderer.enableScissorTest(true);

    this.renderer.setScissor(0, 0, halfWidth, this.height);
    this.renderer.setViewport(0, 0, halfWidth, this.height);
    this.renderer.render(this.scene, this.cameraLeft);

    this.renderer.setScissor(halfWidth, 0, halfWidth, this.height);
    this.renderer.setViewport(halfWidth, 0, halfWidth, this.height);
    this.renderer.render(this.scene, this.cameraRight);
  } else {
    this.renderer.enableScissorTest ( false );
    this.renderer.setViewport( 0, 0, this.width, this.height );
    this.renderer.render(this.scene, this.camera);
  }
};

constr.prototype.resize = function () {
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.renderer.setSize( this.width, this.height );
};

function matrixFromOrientation(q, inverse) {
  var m = Array(16);

  var x = q.x, y = q.y, z = q.z, w = q.w;

  // if inverse is given, invert the quaternion first
  if (inverse) {
    x = -x; y = -y; z = -z;
    var l = Math.sqrt(x*x + y*y + z*z + w*w);
    if (l == 0) {
      x = y = z = 0;
      w = 1;
    } else {
      l = 1/l;
      x *= l; y *= l; z *= l; w *= l;
    }
  }

  var x2 = x + x, y2 = y + y, z2 = z + z;
  var xx = x * x2, xy = x * y2, xz = x * z2;
  var yy = y * y2, yz = y * z2, zz = z * z2;
  var wx = w * x2, wy = w * y2, wz = w * z2;

  m[0] = 1 - (yy + zz);
  m[4] = xy - wz;
  m[8] = xz + wy;

  m[1] = xy + wz;
  m[5] = 1 - (xx + zz);
  m[9] = yz - wx;

  m[2] = xz - wy;
  m[6] = yz + wx;
  m[10] = 1 - (xx + yy);

  m[3] = m[7] = m[11] = 0;
  m[12] = m[13] = m[14] = 0;
  m[15] = 1;

  return m;
}

function cssMatrixFromElements(e) {
  return "matrix3d(" + e.join(",") + ")";
}

function cssMatrixFromOrientation(q, inverse) {
  return cssMatrixFromElements(matrixFromOrientation(q, inverse));
}

var cssCameraPositionTransform = (
  "translate3d(0, 0, 0) rotateZ(180deg) rotateY(180deg)");

constr.prototype.setHmdPositionRotation = function (vrState) {
  if (!vrState) { return; }
  var rotation = vrState.orientation;
  var position = vrState.position;
  this.HMDRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);
  var VR_POSITION_SCALE = 1;
  this.HMDPosition.set(
    -1 * position.x * VR_POSITION_SCALE,
    position.y * VR_POSITION_SCALE,
    -1 * position.z * VR_POSITION_SCALE
  );

  if (this.vrMode) {
    var cssOrientationMatrix = cssMatrixFromOrientation(vrState.orientation, true);
    this.cssCamera.style.transform = (
      cssOrientationMatrix + " " + cssCameraPositionTransform);
  }
};

constr.prototype.toggleVrMode = function () {
    this.vrMode = !this.vrMode;
    this.cssCamera.style.transform = '';
};

constr.prototype.updateCameraRotation = function () {
  this.camera.quaternion.multiplyQuaternions(
    this.BaseRotation,
    this.HMDRotation);
  this.cameraPivot.quaternion.multiplyQuaternions(
    this.BaseRotation,
    this.HMDRotation);
  this.cameraPivot.position.copy(this.HMDPosition);
};

return constr;

}());
