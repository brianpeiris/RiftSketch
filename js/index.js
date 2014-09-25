'use strict';

var File = (function () {
  var constr = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents === undefined ? (
      'var RandomRunner = function () {\n\
  var cube = new THREE.Mesh(\n\
    new THREE.BoxGeometry(1, 1, 1),\n\
    new THREE.MeshLambertMaterial(\n\
      {color: new THREE.Color(\n\
        Math.random(),\n\
        Math.random(),\n\
        Math.random()\n\
      )}\n\
    )\n\
  );\n\
  cube.position.x = 5;\n\
  cube.position.z = 5;\n\
  cube.rotation.x = Math.random() * Math.PI * 2;\n\
  cube.rotation.y = Math.random() * Math.PI * 2;\n\
  cube.rotation.z = Math.random() * Math.PI * 2;\n\
  scene.add(cube);\n\
  var velocity = new THREE.Vector3();\n\
  this.update = function () {\n\
    if (Math.random() < 0.01) {\n\
      cube.rotation.x += (Math.random() - 0.5) * 2;\n\
      cube.rotation.y += (Math.random() - 0.5) * 2;\n\
      cube.rotation.z += (Math.random() - 0.5) * 2;\n\
    }\n\
    cube.translateX(0.2)\n\
  };\n\
};\n\
var randomRunners = [];\n\
var numRandomRunners = 50;\n\
for (var i = 0; i < numRandomRunners; i++) {\n\
  randomRunners.push(new RandomRunner());\n\
}\n\
\n\
scene.add(new THREE.PointLight())\n\
\n\
return function () {  \n\
  for (var i = 0; i < numRandomRunners; i++) {\n\
    randomRunners[i].update();\n\
  }\n\
};\n\
') : contents;
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

    $scope.is_editor_visible = true;
    var domElement = this.riftSandbox.container;
    document.addEventListener('keypress', function (e) {
      if (e.altKey) {
        switch (e.key) {
          case 'v':
            this.riftSandbox.toggleVrMode();
            domElement.mozRequestFullScreen({
              vrDisplay: this.deviceManager.hmdDevice });
            break;
          case 'z':
            this.deviceManager.sensorDevice.zeroSensor();
            break;
          case 'e':
            $scope.is_editor_visible = !$scope.is_editor_visible;
            if (!this.scope.$$phase) { this.scope.$apply(); }
            break;
          default:
            return;
        }
        e.preventDefault();
      }
    }.bind(this), false);
    document.addEventListener('mozfullscreenchange', function () {
      if (!document.mozFullScreenElement && this.riftSandbox.vrMode) {
        this.riftSandbox.toggleVrMode();
      }
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
