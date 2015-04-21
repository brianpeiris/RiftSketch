define([
  'Three',

  'TextArea',

  'VRControls',
  'VREffect',
  'WebVRPolyfill',
  'WebVRManager',
],
function (
  THREE,
  TextArea,
  VRControls,
  VREffect,
  WebVRPolyfill,
  WebVRManager
) {
  'use strict';
  var BASE_POSITION = new THREE.Vector3(0, 1.5, -2);
  var BASE_ROTATION = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, Math.PI, 0), 'YZX');

  var constr = function (width, height, domTextArea, callback) {
    this.width = width;
    this.height = height;
    this.domTextArea = domTextArea;
    window.HMDRotation = this.HMDRotation = new THREE.Quaternion();
    this.BasePosition = new THREE.Vector3(0, 1.5, -2);
    this.HMDPosition = new THREE.Vector3();
    // this.BaseRotation = new THREE.Quaternion();
    this.plainRotation = new THREE.Vector3();
    this.BaseRotationEuler = new THREE.Euler(0, Math.PI);
    this.scene = null;
    this.sceneStuff = [];
    this.renderer = null;
    this.vrMode = false;
    this._targetVelocity = 0;
    this._velocity = 0;
    this._rampUp = true;
    this._rampRate = 0;

    this.initWebGL();
    this.initScene(callback);
  };

  constr.prototype.initScene = function (callback) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75, this.width / this.height, 1, 10000);

    this.controls = new THREE.VRControls(this.camera);
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(this.width, this.height);

    this.vrManager = new WebVRManager(this.renderer, this.effect);

    var maxAnisotropy = this.renderer.getMaxAnisotropy();
    var groundTexture = THREE.ImageUtils.loadTexture('img/background.png');
    groundTexture.anisotropy = maxAnisotropy;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 1000, 1000 );
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry( 1000, 1000 ),
      new THREE.MeshBasicMaterial({map: groundTexture}) );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.textArea = new TextArea(this.domTextArea);
    this.textArea.object.position.set(0, 1.5, 0);
    this.scene.add(this.textArea.object);

    var oldAdd = this.scene.add;
    this.scene.add = function (obj) {
      this.sceneStuff.push(obj);
      oldAdd.call(this.scene, obj);
    }.bind(this);
  };

  constr.prototype.toggleTextArea = function (shouldBeVisible) {
    this.textArea.toggle(shouldBeVisible);
  };

  function angleRangeRad(angle) {
    while (angle > Math.PI) angle -= 2*Math.PI;
    while (angle <= -Math.PI) angle += 2*Math.PI;
    return angle;
  }

  constr.prototype.setBaseRotation = function () {
    this.BaseRotationEuler.set(
      angleRangeRad(this.BaseRotationEuler.x),
      angleRangeRad(this.BaseRotationEuler.y), 0.0 );
    this.BaseRotation.setFromEuler(this.BaseRotationEuler, 'YZX');
  };

  constr.prototype.initWebGL = function () {
    try {
      this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          canvas: document.getElementById('viewer')
      });
    }
    catch(e){
      alert('This application needs WebGL enabled!');
      return false;
    }

    this.renderer.setClearColor(0xD3D3D3, 1.0);
    this.renderer.setSize(this.width, this.height);

    this.container = document.getElementById('container');
  };

  constr.prototype.clearScene = function () {
    for (var i = 0; i < this.sceneStuff.length; i++) {
      this.scene.remove(this.sceneStuff[i]);
    }
    this.sceneStuff = [];
  };

  constr.prototype.render = function () {
    this.vrManager.getHMD().then(function (hmd) {
      this.textArea.update();
      this.controls.update();
      if (!hmd) {
        this.camera.quaternion.multiplyQuaternions(BASE_ROTATION, this.camera.quaternion);
      }

      if (this.hasVR) {
        this.camera.quaternion.multiplyQuaternions(BASE_ROTATION, this.camera.quaternion);
        var rotatedHMDPosition = new THREE.Vector3();
        rotatedHMDPosition.copy(this.camera.position);
        rotatedHMDPosition.applyQuaternion(BASE_ROTATION);
        this.camera.position.copy(BASE_POSITION).add(rotatedHMDPosition);
      }
      else {
        this.camera.position.copy(BASE_POSITION);
      }

      if (this.vrManager.isVRMode()) {
        this.effect.render(this.scene, this.camera);
      }
      else {
        this.renderer.render(this.scene, this.camera);
      }
    }.bind(this));
  };

  constr.prototype.resize = function () {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.effect.setSize(this.width, this.height);
  };

  constr.prototype.setRotation = function (rotation) {
    this.plainRotation.set(0, rotation.y, 0);
  };

  constr.prototype.setHmdPositionRotation = function (vrState) {
    if (!vrState) { return; }
    var rotation = vrState.orientation;
    var position = vrState.position;
    this.HMDRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);
    var VR_POSITION_SCALE = 1;
    if (position) {
      this.HMDPosition.set(
        position.x * VR_POSITION_SCALE,
        position.y * VR_POSITION_SCALE,
        position.z * VR_POSITION_SCALE
      );
    }
  };

  constr.prototype.toggleVrMode = function () {
      this.vrMode = !this.vrMode;
  };

  // constr.prototype.updateCameraPositionRotation = function () {
  //   this._move();
  //   if (!this.vrMode) {
  //     this.camera.rotation.set(0 , this.plainRotation.y, 0);
  //   }
  //   this.cameraPivot.quaternion.multiplyQuaternions(
  //     this.BaseRotation, this.HMDRotation);
  //
  //   var rotatedHMDPosition = new THREE.Vector3();
  //   rotatedHMDPosition.copy(this.HMDPosition);
  //   rotatedHMDPosition.applyQuaternion(this.BaseRotation);
  //   this.cameraPivot.position.copy(this.BasePosition).add(rotatedHMDPosition);
  // };

  constr.prototype.setVelocity = function (velocity) {
    this._rampUp = velocity > this._targetVelocity;
    this._rampRate = Math.abs(velocity - this._targetVelocity) * 0.1;
    this._targetVelocity = velocity;
  };

  constr.prototype._move = function () {
    if (this._rampUp && this._velocity < this._targetVelocity) {
      this._velocity += this._rampRate;
    }
    else if (!this._rampUp && this._velocity > this._targetVelocity) {
      this._velocity -= this._rampRate;
    }
    var movementVector = new THREE.Vector3(0, 0, -1);
    movementVector.applyQuaternion(this.BaseRotation);
    movementVector.multiplyScalar(this._velocity);
    this.BasePosition.add(movementVector);
  };

  return constr;
});
