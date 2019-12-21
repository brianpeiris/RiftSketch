import * as THREE from "three";

import TextArea from "./TextArea";
import Monitor from "./Monitor";

function angleRangeRad(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle <= -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export default class RiftSandbox {
  constructor(width, height, domMonitor) {
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
    this.BaseRotation = new THREE.Quaternion().setFromEuler(this.BaseRotationEuler);
    this.scene = null;
    this.sceneStuff = [];
    this.renderer = null;
    this._targetVelocity = 0;
    this._velocity = 0;
    this._rampUp = true;
    this._rampRate = 0;

    this.initWebGL();
    this.initScene();

    this.resize = this.resize.bind(this);
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 200);
    this.scene.add(this.camera);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const groundTexture = new THREE.TextureLoader().load("img/background.png");

    groundTexture.anisotropy = maxAnisotropy;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(200, 200);

    const ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(200, 200),
      new THREE.MeshBasicMaterial({ map: groundTexture })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const axis = new THREE.AxesHelper();
    axis.position.y = 0.1;
    this.scene.add(axis);

    this.monitor = new Monitor(this.domMonitor);
    this.camera.add(this.monitor.object);
  }

  setTextAreas(domTextAreas) {
    this.domTextAreas = domTextAreas;
    this.textAreas = this.domTextAreas.map(domTextArea => {
      const textArea = new TextArea(domTextArea);
      this.scene.add(textArea.object);
      return textArea;
    });

    this.resetTextAreas();
  }

  resetTextAreas() {
    this.textAreas.forEach(function(textArea, i) {
      textArea.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), (Math.PI / 4) * -(i + 1));
      textArea.object.translateZ(-1.5);
    });
  }

  interceptScene() {
    const oldAdd = this.scene.add;
    this.scene.add = obj => {
      this.sceneStuff.push(obj);
      oldAdd.call(this.scene, obj);
    };
  }

  toggleTextAreas() {
    this.areTextAreasVisible = !this.areTextAreasVisible;
    this.textAreas.forEach(textArea => {
      textArea.toggle(this.areTextAreasVisible);
    });
  }

  toggleMonitor() {
    this.monitor.toggle();
  }

  setInfo(msg) {
    this.textAreas.forEach(function(textArea) {
      textArea.setInfo(msg);
    });
  }

  setBaseRotation() {
    this.BaseRotationEuler.set(angleRangeRad(this.BaseRotationEuler.x), angleRangeRad(this.BaseRotationEuler.y), 0.0);
    this.BaseRotation.setFromEuler(this.BaseRotationEuler, "YZX");
  }

  initWebGL() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("viewer")
      });
      this.renderer.setPixelRatio(devicePixelRatio);
    } catch (e) {
      alert("This application needs WebGL enabled!");
      return false;
    }

    this.renderer.setClearColor(0xd3d3d3, 1.0);
    this.renderer.setSize(this.width, this.height);

    this.container = document.getElementById("container");
  }

  clearScene() {
    for (let i = 0; i < this.sceneStuff.length; i++) {
      this.scene.remove(this.sceneStuff[i]);
    }
    this.sceneStuff = [];
  }

  render(timestamp) {
    if (this.textAreas) {
      this.textAreas.forEach(function(textArea) {
        textArea.update();
      });
    }
    this.monitor.update();

    this.camera.position.copy(this.BasePosition);

    this.renderer.render(this.scene, this.camera, timestamp);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  setRotation(rotation) {
    this.plainRotation.set(0, rotation.y, 0);
  }

  setHmdPositionRotation(vrState) {
    if (!vrState) {
      return;
    }
    const rotation = vrState.orientation;
    const position = vrState.position;
    this.HMDRotation.set(rotation.x, rotation.y, rotation.z, rotation.w);
    const VR_POSITION_SCALE = 1;
    if (position) {
      this.HMDPosition.set(
        position.x * VR_POSITION_SCALE,
        position.y * VR_POSITION_SCALE,
        position.z * VR_POSITION_SCALE
      );
    }
  }

  resetSensor() {
    this.controls.resetSensor();
  }

  startVrMode() {
    this.vrManager.anyModeToVR();
    this.vrManager.setMode_(3);
  }

  setVelocity(velocity) {
    this._rampUp = velocity > this._targetVelocity;
    this._rampRate = Math.abs(velocity - this._targetVelocity) * 0.1;
    this._targetVelocity = velocity;
  }

  _move() {
    if (this._rampUp && this._velocity < this._targetVelocity) {
      this._velocity += this._rampRate;
    } else if (!this._rampUp && this._velocity > this._targetVelocity) {
      this._velocity -= this._rampRate;
    }
    const movementVector = new THREE.Vector3(0, 0, -1);
    movementVector.applyQuaternion(this.BaseRotation);
    movementVector.multiplyScalar(this._velocity);
    this.BasePosition.add(movementVector);
  }
}
