'use strict';

var File = (function () {
  var constr = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents === undefined ? (
      'scene.add(new THREE.PointLight())\n\n\
var cube = new THREE.Mesh(\n\
new THREE.CubeGeometry(2, 2, 2),\n\
new THREE.MeshLambertMaterial(\n\
  {color: \'red\'}));\n\n\
cube.position.y = 5;\n\
cube.position.z = 10;\n\
scene.add(cube);\n\
return function () {\n\
    cube.rotation.y += 0.01;\n\
};') : contents;
    this.selected = true;
  };
  return constr;
}());

var Sketch = (function () {
  var constr = function (name, files) {
    this.name = name || 'Example Sketch';
    this.files = files || [
      new File()
    ];
  };
  constr.prototype.getCode = function () {
    var code = '';
    for (var i = 0; i < this.files.length; i++) {
      code += this.files[i].contents;
    }
    return code;
  };
  constr.prototype.addFile = function () {
    this.files.push(new File('Untitled', ''));
  };
  return constr;
}());

angular.module('index', [])
  .controller('SketchController', ['$scope', function($scope) {
    this.scope = $scope;
    var autosave = localStorage.getItem('autosave');
    var files;
    if (autosave) {
        files = [new File('autosave', autosave)];
        $scope.sketch = new Sketch('autosave', files);
    }
    else {
        $scope.sketch = new Sketch(files);
    }

    this.sketchLoop = function () {};

    this.mainLoop = function () {
      window.requestAnimationFrame( this.mainLoop.bind(this) );

      // Apply movement
      if (this.deviceManager.sensorDevice) {
        this.riftSandbox.setHmdPositionRotation(
          this.deviceManager.sensorDevice.getState());
        this.riftSandbox.setBaseRotation();
        this.riftSandbox.updateCameraRotation();
      }

      try {
        this.sketchLoop();
      }
      catch (err) {
        if (this.scope.error === null) {
          this.scope.error = err.toString();
          if (!this.scope.$$phase) { this.scope.$apply(); }
        }
      }

      this.riftSandbox.render();
    };

    this.deviceManager = new DeviceManager();
    // TODO: Obviously, RiftSandox and the resize event listener should not be
    // part of an angular controller.
    this.riftSandbox = new RiftSandbox(window.innerWidth, window.innerHeight);
    this.deviceManager.onResizeFOV = function (
      renderTargetSize, fovLeft, fovRight
    ) {
      this.riftSandbox.setFOV(fovLeft, fovRight);
    }.bind(this);
    this.deviceManager.onHMDDeviceFound = function (hmdDevice) {
      var eyeOffsetLeft = hmdDevice.getEyeTranslation("left");
      var eyeOffsetRight = hmdDevice.getEyeTranslation("right");
      this.riftSandbox.setCameraOffsets(eyeOffsetLeft, eyeOffsetRight);
    }.bind(this);

    window.addEventListener(
      'resize',
      this.riftSandbox.resize.bind(this.riftSandbox),
      false
    );

    var domElement = this.riftSandbox.container;
    domElement.addEventListener('click', function () {
      domElement.mozRequestFullScreen({
        vrDisplay: this.deviceManager.hmdDevice });
    }.bind(this), false);

    this.riftSandbox.resize();
    this.deviceManager.init();
    this.mainLoop();

    var that = this;
    $scope.$watch('sketch.getCode()', function (newVal, oldVal) {
      that.riftSandbox.clearScene();
      var _sketchLoop;
      $scope.error = null;
      try {
        _sketchLoop = (new Function('scene', '"use strict";\n' + newVal))(
          that.riftSandbox.scene);
      }
      catch (err) {
        $scope.error = err.toString();
      }
      if (_sketchLoop) {
        that.sketchLoop = _sketchLoop;
      }
      localStorage.setItem('autosave', newVal);
    });
  }]);
