require.config({
  waitSeconds: 30,
  baseUrl: '',
  paths: {
    angular: 'lib/angular/angular',
    leap: 'lib/leap-0.6.3',
    oauth: 'bower_components/oauth-js/dist/oauth',
    lodash: 'bower_components/lodash/dist/lodash',
    mousetrap: 'lib/mousetrap',
    Three: 'lib/ThreeJS/Three',
    VRControls: 'lib/VRControls',
    VREffect: 'lib/VREffect',

    RiftSandbox: 'js/RiftSandbox',
    TextArea: 'js/TextArea',
    File: 'js/File',
    Sketch: 'js/Sketch'
  },
  shim: {
    angular: {exports: 'angular'},
    leap: {exports: 'Leap'},
    oauth: {exports: 'OAuth'},
    Three: {exports: 'THREE'},
    VRControls: {deps: ['Three']},
    VREffect: {deps: ['Three']}
  }
});

require([
  'angular',
  'leap',
  'oauth',
  'lodash',
  'mousetrap',

  'RiftSandbox',
  'File',
  'Sketch'
],
function (
  angular,
  Leap,
  OAuth,
  _,
  Mousetrap,

  RiftSandbox,
  File,
  Sketch
) {
  'use strict';

  angular.module('index', [])
    .controller('SketchController', ['$scope', function($scope) {
      // TODO: lol, this controller is out of control. Refactor and maybe actually
      // use Angular properly.

      var setupVideoPassthrough = function () {
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia(
          {video: true},
          function (stream) {
            var monitor = document.getElementById('monitor');
            monitor.src = window.URL.createObjectURL(stream);
          },
          function () {
            // video pass-through is optional.
          }
        );
      };
      setupVideoPassthrough();

      var setupSketch = function () {
        var autosave = localStorage.getItem('autosave');
        var files;
        if (autosave) {
          files = [new File('autosave', autosave)];
          $scope.sketch = new Sketch('autosave', files);
        }
        else {
          $scope.sketch = new Sketch(files);
        }
      };
      setupSketch();

      // TODO: Most of this should be in a directive instead of in the controller.
      var mousePos = {x: 0, y: 0};
      window.addEventListener(
        'mousemove',
        function (e) {
          mousePos.x = e.clientX;
          mousePos.y = e.clientY;
        },
        false
      );

      this.sketchLoop = function () {};

      this.mainLoop = function () {
        window.requestAnimationFrame( this.mainLoop.bind(this) );

        // Apply movement
        // if (this.deviceManager.sensorDevice && this.riftSandbox.vrMode) {
        //   this.riftSandbox.setHmdPositionRotation(
        //     this.deviceManager.sensorDevice.getState());
        // }
        // else {
        //   this.riftSandbox.setRotation({
        //     y: mousePos.x / window.innerWidth * Math.PI * 2
        //   });
        // }
        // this.riftSandbox.setBaseRotation();
        // this.riftSandbox.updateCameraPositionRotation();

        try {
          this.sketchLoop();
        }
        catch (err) {
          this.riftSandbox.textArea.setInfo(err.toString());
        }

        this.riftSandbox.render();
      };

      var spinNumberAndKeepSelection = function (direction, amount) {
        var start = this.domTextArea.selectionStart;
        $scope.sketch.files[0].spinNumberAt(start, direction, amount);
        if (!$scope.$$phase) { $scope.$apply(); }
        this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
      }.bind(this);

      var offsetNumberAndKeepSelection = function (offset) {
        var start = this.domTextArea.selectionStart;
        $scope.sketch.files[0].offsetOriginalNumber(offset);
        if (!$scope.$$phase) { $scope.$apply(); }
        this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
      }.bind(this);

      this.handStart = this.handCurrent = null;
      this.altPressed = this.shiftPressed = false;
      Leap.loop({}, function (frame) {
        if (frame.hands.length) {
          this.handCurrent = frame;
          if (this.altPressed && this.handStart) {
            var hand = frame.hands[0];
            var handTranslation = hand.translation(this.handStart);
            var factor = this.shiftPressed ? 10 : 100;
            var offset = Math.round(handTranslation[1] / factor * 1000) / 1000;
            offsetNumberAndKeepSelection(offset);
          }
        }
        this.previousFrame = frame;
      }.bind(this));

      OAuth.initialize('bnVXi9ZBNKekF-alA1aF7PQEpsU');
      var apiCache = {};
      var api = _.throttle(function (provider, url, data, callback) {
        var cacheKey = url + JSON.stringify(data);
        var cacheEntry = apiCache[cacheKey];
        if (cacheEntry && (Date.now() - cacheEntry.lastCall) < 1000 * 60 * 5) {
          callback(cacheEntry.data);
          return;
        }
        OAuth.popup(
          provider,
          {cache: true}
        ).done(function(result) {
          result.get(
            url,
            {data: data, cache: true}
          ).done(function (data) {
            apiCache[cacheKey] = {
              lastCall: Date.now(),
              data: data
            };
            callback(data);
          });
        });
      }, 1000);

      $scope.is_editor_visible = true;
      this.bindKeyboardShortcuts = function () {
        Mousetrap.bind('alt+z', function () {
          this.riftSandbox.controls.zeroSensor();
          return false;
        }.bind(this));
        Mousetrap.bind('alt+e', function () {
          $scope.is_editor_visible = !$scope.is_editor_visible;
          this.riftSandbox.toggleTextArea($scope.is_editor_visible);
          if (!$scope.$$phase) { $scope.$apply(); }
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

        var MOVEMENT_RATE = 0.01;
        var ROTATION_RATE = 0.01;

        Mousetrap.bind('w', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.setVelocity(MOVEMENT_RATE);
          }
        }.bind(this), 'keydown');
        Mousetrap.bind('w', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.setVelocity(0);
          }
        }.bind(this), 'keyup');

        Mousetrap.bind('s', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.setVelocity(-MOVEMENT_RATE);
          }
        }.bind(this), 'keydown');
        Mousetrap.bind('s', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.setVelocity(0);
          }
        }.bind(this), 'keyup');

        Mousetrap.bind('a', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.BaseRotationEuler.y += ROTATION_RATE;
          }
        }.bind(this));
        Mousetrap.bind('d', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.BaseRotationEuler.y -= ROTATION_RATE;
          }
        }.bind(this));

        Mousetrap.bind('q', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.BaseRotationEuler.y += Math.PI / 4;
          }
        }.bind(this));
        Mousetrap.bind('e', function () {
          if (!$scope.is_editor_visible) {
            this.riftSandbox.BaseRotationEuler.y -= Math.PI / 4;
          }
        }.bind(this));

        Mousetrap.bind(['shift', 'alt+shift'], function () {
          if (this.shiftPressed) { return false; }
          this.shiftPressed = true;
          return false;
        }.bind(this), 'keydown');
        Mousetrap.bind('shift', function () {
          this.shiftPressed = false;
          return false;
        }.bind(this), 'keyup');

        Mousetrap.bind('alt', function () {
          if (this.altPressed) { return false; }
          var start = this.domTextArea.selectionStart;
          $scope.sketch.files[0].recordOriginalNumberAt(start);
          this.handStart = this.handCurrent;
          this.altPressed = true;
          return false;
        }.bind(this), 'keydown');
        Mousetrap.bind('alt', function () {
          this.altPressed = false;
          return false;
        }.bind(this), 'keyup');
      }.bind(this);
      this.bindKeyboardShortcuts();

      var toggleVrMode = function () {
        if (
          !(document.mozFullScreenElement || document.webkitFullScreenElement) &&
          this.riftSandbox.vrMode
        ) {
          $scope.isInfullscreen = false;
          if (!$scope.$$phase) { $scope.$apply(); }
          this.riftSandbox.toggleVrMode();
        }
        else {
          $scope.isInfullscreen = true;
          if (!$scope.$$phase) { $scope.$apply(); }
        }
      }.bind(this);
      document.addEventListener('mozfullscreenchange', toggleVrMode, false);
      document.addEventListener('webkitfullscreenchange', toggleVrMode, false);
      $(function () {
        // HACK: I really need to turn this DOM manipulation into a directive.
        this.domTextArea = document.querySelector('textarea');
        var $domTextArea = $(this.domTextArea);
        $domTextArea.on('blur', function () {
          $domTextArea.focus();
          this.domTextArea.selectionStart = this.domTextArea.selectionEnd = 0;
        }.bind(this));
        $domTextArea.focus();
        this.domTextArea.selectionStart = this.domTextArea.selectionEnd = 0;
        this.riftSandbox = new RiftSandbox(
          window.innerWidth, window.innerHeight, this.domTextArea,
          function (err) {
            $scope.seemsUnsupported = !!err;
            if (!$scope.$$phase) { $scope.$apply(); }
          }.bind(this)
        );

        $scope.$watch('sketch.getCode()', function (code) {
          this.riftSandbox.clearScene();
          var _sketchLoop;
          this.riftSandbox.textArea.setInfo('');
          try {
            /* jshint -W054 */
            var _sketchFunc = new Function(
              'scene', 'camera', 'api',
              '"use strict";\n' + code
            );
            /* jshint +W054 */
            _sketchLoop = _sketchFunc(
              this.riftSandbox.scene, this.riftSandbox.cameraPivot, api);
          }
          catch (err) {
            this.riftSandbox.textArea.setInfo(err.toString());
          }
          if (_sketchLoop) {
            this.sketchLoop = _sketchLoop;
          }
          localStorage.setItem('autosave', code);
        }.bind(this));
        if (!$scope.$$phase) { $scope.$apply(); }

        window.addEventListener(
          'resize',
          this.riftSandbox.resize.bind(this.riftSandbox),
          false
        );

        Mousetrap.bind('alt+v', function () {
          this.riftSandbox.toggleVrMode();
          this.riftSandbox.effect.startFullscreen();
          return false;
        }.bind(this));

        this.riftSandbox.resize();

        this.mainLoop();
      }.bind(this));
    }]);
});
