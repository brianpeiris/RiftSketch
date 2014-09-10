var RiftSandbox = (function () {
'use strict';

var constr = function (width, height) {
  this.width = width;
  this.height = height;
  window.HMDRotation = this.HMDRotation = new THREE.Quaternion();
  this.HMDPosition = new THREE.Vector3();
  this.BaseRotation = new THREE.Quaternion();
  this.BaseRotationEuler = new THREE.Vector3(0, Math.PI);
  this.scene = null;
  this.sceneStuff = [];
  this.cameraLeft = null;
  this.cameraRight = null;
  this.renderer = null;
  this.initWebGL();
};

constr.prototype.initScene = function () {
  // create scene
  this.scene = new THREE.Scene();

  // Create camera
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
    this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
  }
  catch(e){
    console.log(e);
    alert('This application needs WebGL enabled!');
    return false;
  }

  this.renderer.setClearColor(0x202020, 1.0);
  //this.renderer.autoClearColor = false;
  this.renderer.setSize( this.width, this.width );

  var viewer = document.getElementById('viewer');
  viewer.appendChild(this.renderer.domElement);
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

  this.renderer.enableScissorTest(true);

  this.renderer.setScissor(0, 0, halfWidth, this.height);
  this.renderer.setViewport(0, 0, halfWidth, this.height);
  this.renderer.render(this.scene, this.cameraLeft);

  this.renderer.setScissor(halfWidth, 0, halfWidth, this.height);
  this.renderer.setViewport(halfWidth, 0, halfWidth, this.height);
  this.renderer.render(this.scene, this.cameraRight);
};

constr.prototype.resize = function () {
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.renderer.setSize( this.width, this.height );
};

constr.prototype.setHmdPositionRotation = function (vrState) {
  if (!vrState) { return; }
  var rotation = vrState.orientation;
  var position = vrState.position;
  this.HMDRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);
  var VR_POSITION_SCALE = 25;
  this.HMDPosition.set(
    -1 * position.x * VR_POSITION_SCALE,
    position.y * VR_POSITION_SCALE,
    -1 * position.z * VR_POSITION_SCALE
  );
};

constr.prototype.updateCameraRotation = function () {
  this.cameraPivot.quaternion.multiplyQuaternions(
    this.BaseRotation,
    this.HMDRotation);
  this.cameraPivot.position = this.HMDPosition;
};

return constr;

}());
