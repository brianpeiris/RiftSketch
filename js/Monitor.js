define([
  'three'
],
function (
  THREE
) {
  'use strict';

  var MESH_SIZE = 0.5;
  var WIDTH = 1024;
  var HEIGHT = 512;
  var ASPECT = HEIGHT / WIDTH;

  var constr = function (domMonitor) {
    this.domMonitor = domMonitor;

    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.context = this.canvas.getContext('2d');

    this.monitorTexture = new THREE.Texture(this.canvas);
    this.monitorTexture.needsUpdate = true;

    var monitorMaterial = new THREE.MeshBasicMaterial({
      map: this.monitorTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    this.object = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(MESH_SIZE, MESH_SIZE * ASPECT, 1, 1),
      monitorMaterial
    );
    this.object.visible = false;
    this.object.position.set(0, -0.2, -0.5);
    this.object.rotation.set(-Math.PI / 4, 0, 0);
  };

  constr.prototype.toggle = function () {
    this.object.visible = !this.object.visible;
  };

  constr.prototype.update = function () {
    this.context.drawImage(
      this.domMonitor,
      0, 0, WIDTH, HEIGHT);
    this.monitorTexture.needsUpdate = true;
  };

  return constr;
});
