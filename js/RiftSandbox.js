import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton";

import TextArea from "./TextArea";
import Monitor from "./Monitor";

export default class RiftSandbox {
  constructor(width, height, domMonitor) {
    this._width = width;
    this._height = height;
    this._textAreas = null;
    this.areTextAreasVisible = true;
    this._domMonitor = domMonitor;

    this.scene = null;
    this._sceneStuff = [];
    this._renderer = null;

    this._initWebGL();
    this._initScene();

    this.resize = this.resize.bind(this);
  }

  _initScene() {
    this.scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(75, this._width / this._height, 0.1, 200);
    this._camera.position.y = 1.6;

    const dolly = new THREE.Group();
    dolly.position.z = 2;
    dolly.add(this._camera);
    this.scene.add(dolly);

    const maxAnisotropy = this._renderer.capabilities.getMaxAnisotropy();
    const groundTexture = new THREE.TextureLoader().load("img/ground.png");

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

    this._monitor = new Monitor(this._domMonitor);
    this._camera.add(this._monitor.object);
  }

  setTextAreas(domTextAreas) {
    this.domTextAreas = domTextAreas;
    this._textAreas = this.domTextAreas.map(domTextArea => {
      const textArea = new TextArea(domTextArea);
      this.scene.add(textArea.object);
      return textArea;
    });

    this._resetTextAreas();
  }

  _resetTextAreas() {
    this._textAreas.forEach(function(textArea, i) {
      textArea.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), (Math.PI / 4) * -(i + 1));
      textArea.object.translateZ(-1.5);
    });
  }

  interceptScene() {
    const oldAdd = this.scene.add;
    this.scene.add = obj => {
      this._sceneStuff.push(obj);
      oldAdd.call(this.scene, obj);
    };
  }

  toggleTextAreas() {
    this.areTextAreasVisible = !this.areTextAreasVisible;
    this._textAreas.forEach(textArea => {
      textArea.toggle(this.areTextAreasVisible);
    });
  }

  toggleMonitor() {
    this._monitor.toggle();
  }

  setInfo(msg) {
    this._textAreas.forEach(function(textArea) {
      textArea.setInfo(msg);
    });
  }

  _initWebGL() {
    try {
      this._renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("viewer")
      });
      this._renderer.setPixelRatio(devicePixelRatio);
      this._renderer.vr.enabled = true;
      document.body.append(VRButton.createButton(this._renderer));
    } catch (e) {
      alert("This application needs WebGL enabled!");
      return false;
    }

    this._renderer.setClearColor(0xd3d3d3, 1.0);
    this._renderer.setSize(this._width, this._height);

    this.container = document.getElementById("container");
  }

  clearScene() {
    for (let i = 0; i < this._sceneStuff.length; i++) {
      this.scene.remove(this._sceneStuff[i]);
    }
    this._sceneStuff = [];
  }

  render() {
    if (this._textAreas) {
      this._textAreas.forEach(function(textArea) {
        textArea.update();
      });
    }
    this._monitor.update();

    this._renderer.render(this.scene, this._camera);
  }

  resize() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._camera.aspect = this._width / this._height;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(this._width, this._height);
  }

  resetSensor() {
    // TODO Is this still valid with WebXR?
  }

  startVrMode() {
    // TODO Enter VR
  }
}
