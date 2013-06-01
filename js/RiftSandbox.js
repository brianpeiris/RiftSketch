var RiftSandbox = (function () {
'use strict';

var constr = function (width, height) {
  this.width = width;
  this.height = height;
  this.headingVector = new THREE.Vector3();
  this.HMDRotation = new THREE.Quaternion();
  this.BaseRotation = new THREE.Quaternion();
  this.BaseRotationEuler = new THREE.Vector3();
  this.moveVector = new THREE.Vector3();
  this.scene = null;
  this.sceneStuff = [];
  this.camera = null;
  this.effect = null;
  this.renderer = null;
  this.OculusRift = {
    // Parameters from the Oculus Rift DK1
    hResolution: 1280,
    vResolution: 800,
    hScreenSize: 0.14976,
    vScreenSize: 0.0936,
    interpupillaryDistance: 0.064,
    lensSeparationDistance: 0.064,
    eyeToScreenDistance: 0.041,
    distortionK : [1.0, 0.22, 0.24, 0.0]
  };
  this.initWebGL();
};

constr.prototype.initScene = function () {
  // create scene
  this.scene = new THREE.Scene();

  // Create camera
  this.camera = new THREE.PerspectiveCamera( 60, this.width/this.height, 1, 1100 );
  // TODO: Is this necessary?
  this.camera.target = new THREE.Vector3( 1, 0, 0 );
  this.camera.useQuaternion = true;
  this.scene.add( this.camera );

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
    angleRangeRad(this.BaseRotationEuler.x + this.moveVector.x),
    angleRangeRad(this.BaseRotationEuler.y + this.moveVector.y), 0.0 );
  this.BaseRotation.setFromEuler(this.BaseRotationEuler, 'YZX');
};

constr.prototype.initWebGL = function () {
  this.initScene();

  // Create render
  try {
    this.renderer = new THREE.WebGLRenderer();
  }
  catch(e){
    console.log(e);
    alert('This application needs WebGL enabled!');
    return false;
  }

  this.renderer.autoClearColor = false;
  this.renderer.setSize( this.width, this.width );

  // Add stereo effect
  this.OculusRift.hResolution = this.width;
  this.OculusRift.vResolution = this.height,

  // Add stereo effect
  this.effect = new THREE.OculusRiftEffect(
      this.renderer, { HMD:this.OculusRift } );
  this.effect.setSize( this.width, this.height );

  var viewer = document.getElementById('viewer');
  viewer.appendChild(this.renderer.domElement);

  /*
  var lastSpaceKeyTime = new Date();
  var lastCtrlKeyTime = new Date();
  $(document).keydown(function(e) {
    switch(e.keyCode) {
      case 32:
        var spaceKeyTime = new Date();
        if (spaceKeyTime-lastSpaceKeyTime < 300) {
          $('#settings').toggle(200);
        }
        lastSpaceKeyTime = spaceKeyTime;
        break;
      case 37:
        moveVector.y = KEYBOARD_SPEED;
        break;
      case 38:
        moveVector.x = KEYBOARD_SPEED;
        break;
      case 39:
        moveVector.y = -KEYBOARD_SPEED;
        break;
      case 40:
        moveVector.x = -KEYBOARD_SPEED;
        break;
      case 17:
        var ctrlKeyTime = new Date();
        if (ctrlKeyTime-lastCtrlKeyTime < 300) {
          moveToNextPlace();
        }
        lastCtrlKeyTime = ctrlKeyTime;
        break;
    }
  });

  $(document).keyup(function(e) {
    switch(e.keyCode) {
      case 37:
      case 39:
        moveVector.y = 0.0;
        break;
      case 38:
      case 40:
        moveVector.x = 0.0;
        break;
    }
  });

  viewer.mousedown(function(event) {
    MOVING_MOUSE = !this.riftClient.enabled;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
  });

  viewer.mouseup(function() {
    MOVING_MOUSE = false;
  });

  lastClientX = 0; lastClientY = 0;
  viewer.mousemove(function(event) {
    if (MOVING_MOUSE) {
      BaseRotationEuler.set(
        angleRangeRad(BaseRotationEuler.x + (event.clientY - lastClientY) * MOUSE_SPEED),
        angleRangeRad(BaseRotationEuler.y + (event.clientX - lastClientX) * MOUSE_SPEED),
        0.0
      );
      lastClientX = event.clientX;lastClientY =event.clientY;
      BaseRotation.setFromEuler(BaseRotationEuler, 'YZX');

      updateCameraRotation();
    }
  });
  */
};

constr.prototype.clearScene = function () {
  for (var i = 0; i < this.sceneStuff.length; i++) {
    this.scene.remove(this.sceneStuff[i]);
  }
  this.sceneStuff = [];
};

constr.prototype.render = function () {
  this.effect.render(this.scene, this.camera);
};

constr.prototype.resize = function () {
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.OculusRift.hResolution = this.width,
  this.OculusRift.vResolution = this.height,
  this.effect.setHMD(this.OculusRift);

  this.renderer.setSize( this.width, this.height );
  this.camera.projectionMatrix.makePerspective( 60, this.width / this.height, 1, 1100 );
};

constr.prototype.setHmdRotation = function (data) {
  this.HMDRotation.set(data[1], data[2], data[3], data[0]);
  this.updateCameraRotation();
};

constr.prototype.updateCameraRotation = function () {
  this.camera.quaternion.multiplyQuaternions(
    this.BaseRotation,
    this.HMDRotation);
  this.headingVector.setEulerFromQuaternion(this.camera.quaternion, 'YZX');
};

return constr;

}());
