'use strict';

var File = (function () {
  var constr = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents === undefined ? ('\
var t3 = THREE;\n\
var light = new t3.PointLight();\n\
light.position.set(10, 15, 9);\n\
scene.add(light);\n\
var makeCube = function (x, y, z) {\n\
  var cube = new t3.Mesh(\n\
    new t3.BoxGeometry(1, 1.1, 1),\n\
    new t3.MeshLambertMaterial({color: \'red\'})\n\
  );\n\
  cube.scale.set(0.1, 0.1, 0.1);\n\
  cube.position.set(1, 0, 0.0).add(\n\
    new t3.Vector3(x, y, z));\n\
  scene.add(cube);\n\
  return cube;\n\
};\n\
\n\
var rows, cols, cubes = [], spacing = 0.07;\n\
rows = cols = 18;\n\
for (var r = 0; r < rows; r++) {\n\
  for (var c = 0; c < cols; c++) {\n\
    if (c === 0) { cubes[r] = []; }\n\
    cubes[r][c] = makeCube(r * spacing, 0, c * spacing);\n\
  }\n\
}\n\
var i = 0;\n\
return function () {\n\
  i += -0.05;\n\
  for (var r = 0; r < rows; r++) {\n\
    for (var c = 0; c < cols; c++) {\n\
      var height = (\n\
        Math.sin(r / rows * Math.PI * 2 + i) + \n\
        Math.cos(c / cols * Math.PI * 2 + i)) / 11;\n\
      cubes[r][c].position.setY(height - 0.6);\n\
      cubes[r][c].material.color.setRGB(\n\
        height + 1.0, height + 0.1, 0.1);\n\
    }\n\
  }\n\
};') : contents;
    this.selected = true;
  };
  constr.prototype.findNumberAt = function (index) {
    return this.contents.substring(index).match(/-?\d+\.?\d*/)[0];
  };
  constr.prototype.spinNumber = function (number, direction, amount) {
    if (number.indexOf('.') === -1) {
      return (parseInt(number, 10) + direction * amount).toString();
    }
    else {
      return (parseFloat(number) + direction * amount).toFixed(1);
    }
  }
  constr.prototype.spinNumberAt = function (index, direction, amount) {
    var number = this.findNumberAt(index);
    var newNumber = this.spinNumber(number, direction, amount);
    this.contents = (
      this.contents.substring(0, index) +
      newNumber +
      this.contents.substring(index + number.length)
    );
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
    var spinNumberAndKeepSelection = function (direction, amount) {
      var textarea = document.querySelector('textarea');
      var start = textarea.selectionStart;
      $scope.sketch.files[0].spinNumberAt(start, direction, amount);
      if (!this.scope.$$phase) { this.scope.$apply(); }
      textarea.selectionStart = textarea.selectionEnd = start;
    }.bind(this);
    Mousetrap.bind('alt+v', function () {
      this.riftSandbox.toggleVrMode();
      domElement.mozRequestFullScreen({
        vrDisplay: this.deviceManager.hmdDevice });
      return false;
    }.bind(this));
    Mousetrap.bind('alt+z', function () {
      this.deviceManager.sensorDevice.zeroSensor();
      return false;
    }.bind(this));
    Mousetrap.bind('alt+e', function () {
      $scope.is_editor_visible = !$scope.is_editor_visible;
      if (!this.scope.$$phase) { this.scope.$apply(); }
      return false;
    }.bind(this));
    Mousetrap.bind('alt+u', function () {
      spinNumberAndKeepSelection(-1, 10);
      return false;
    });
    Mousetrap.bind('alt+i', function () {
      spinNumberAndKeepSelection(1, 10);
      return false;
    });
    Mousetrap.bind('alt+j', function () {
      spinNumberAndKeepSelection(-1, 1);
      return false;
    });
    Mousetrap.bind('alt+k', function () {
      spinNumberAndKeepSelection(1, 1);
      return false;
    });
    Mousetrap.bind('alt+m', function () {
      spinNumberAndKeepSelection(-1, 0.1);
      return false;
    });
    Mousetrap.bind('alt+,', function () {
      spinNumberAndKeepSelection(1, 0.1);
      return false;
    });
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
