define([
  'Three',
  'VRControls',
  'VREffect',
  'WebVRPolyfill',
  'WebVRManager',

  'js/TextArea',
  'js/Monitor'
],
function (
  THREE,
  VRControls,
  VREffect,
  WebVRPolyfill,
  WebVRManager,

  TextArea,
  Monitor
) {
  'use strict';
  var BASE_POSITION = new THREE.Vector3(0, 1.5, -2);
  var ONE_DEGREE = Math.PI / 180.0;
  
  var constr = function (
    width, height,
    domMonitor,
    callback
  ) {
    this.width = width;
    this.height = height;
    this.textAreas = null;
    this.areTextAreasVisible = true;
    this.domMonitor = domMonitor;
    window.HMDRotation = this.HMDRotation = new THREE.Quaternion();

    this.BasePosition = new THREE.Vector3(0, 1.5, 2);
    this.HMDPosition = new THREE.Vector3();
    this.plainRotation = new THREE.Vector3();
    this.BaseRotationEuler = new THREE.Euler(0, Math.PI / 2, 0); 
    this.BaseRotation = new THREE.Quaternion().setFromEuler(
      this.BaseRotationEuler);
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
      75, this.width / this.height, 0.1, 200);
    this.scene.add(this.camera);

    this.controls = new THREE.VRControls(this.camera);
    this.effect = new THREE.VREffect(this.renderer);
    this.effect.setSize(this.width, this.height);

    this.vrManager = new WebVRManager(
      this.renderer, this.effect, {hideButton: false});

    var maxAnisotropy = this.renderer.getMaxAnisotropy();
    var groundTexture = THREE.ImageUtils.loadTexture('img/background.png');
    
    groundTexture.anisotropy = maxAnisotropy;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 200, 200 );
    
    var ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 200, 200 ),
      new THREE.MeshBasicMaterial({map: groundTexture}) );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    var axis = new THREE.AxisHelper();
    axis.position.y = 0.1;
    this.scene.add(axis);

    this.monitor = new Monitor(this.domMonitor);
    this.camera.add(this.monitor.object);
  };

  constr.prototype.setTextAreas = function (domTextAreas) {
    this.domTextAreas = domTextAreas;
    this.textAreas = this.domTextAreas.map(function (domTextArea, i) {
      var textArea = new TextArea(domTextArea);
      this.scene.add(textArea.object);
      return textArea;
    }.bind(this));

    this.resetTextAreas();
  };

  constr.prototype.resetTextAreas = function () {
    this.textAreas.forEach(function(textArea, i) {
      textArea.object.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 4 * -(i + 1));
      textArea.object.translateZ(-1.5);
    });
  };

  constr.prototype.interceptScene = function () {
    var oldAdd = this.scene.add;
    this.scene.add = function (obj) {
      this.sceneStuff.push(obj);
      oldAdd.call(this.scene, obj);
    }.bind(this);
  };

  constr.prototype.toggleTextAreas = function () {
    this.areTextAreasVisible = !this.areTextAreasVisible;
    this.textAreas.forEach(function (textArea) {
      textArea.toggle(this.areTextAreasVisible);
    }.bind(this));
  };

  constr.prototype.toggleMonitor = function () {
    this.monitor.toggle();
  };

  constr.prototype.setInfo = function (msg) {
    this.textAreas.forEach(function (textArea) {
      textArea.setInfo(msg);
    });
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

  constr.prototype.render = function (timestamp) {
    if (this.textAreas) {
      this.textAreas.forEach(function (textArea) { textArea.update(); });
    }
    this.monitor.update();
    this.controls.update();

    this.camera.position.copy(this.BasePosition);

    this.vrManager.render(this.scene, this.camera, timestamp);
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
