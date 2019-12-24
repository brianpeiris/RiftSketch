import * as THREE from "three";
const MESH_SIZE = 0.5;
const WIDTH = 1024;
const HEIGHT = 512;
const ASPECT = HEIGHT / WIDTH;
export default class Monitor {
  constructor(domMonitor) {
    this._domMonitor = domMonitor;

    this._canvas = document.createElement("canvas");
    this._canvas.width = WIDTH;
    this._canvas.height = HEIGHT;
    this.context = this._canvas.getContext("2d");

    this._monitorTexture = new THREE.Texture(this._canvas);
    this._monitorTexture.needsUpdate = true;

    const monitorMaterial = new THREE.MeshBasicMaterial({
      map: this._monitorTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    this.object = new THREE.Mesh(new THREE.PlaneBufferGeometry(MESH_SIZE, MESH_SIZE * ASPECT, 1, 1), monitorMaterial);
    this.object.visible = false;
    this.object.position.set(0, -0.2, -0.5);
    this.object.rotation.set(-Math.PI / 4, 0, 0);
  }

  toggle() {
    this.object.visible = !this.object.visible;
  }

  update() {
    if (!this._domMonitor) return;
    this.context.drawImage(this._domMonitor, 0, 0, WIDTH, HEIGHT);
    this._monitorTexture.needsUpdate = true;
  }
}
