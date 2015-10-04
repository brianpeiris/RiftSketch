define([
  'firebase',
  'jquery',
  'leap',
  'leapjsplugins',
  'oauth',
  'lodash',
  'kibo',

  'js/RiftSandbox',
  'js/File',
  'js/Sketch',

  'text!js/Files/Behaviors.js',
  'text!js/Files/Boid.js',
  'text!js/Files/World.js'
],
function (
  Firebase,
  $,
  Leap,
  leapjsplugins,
  OAuth,
  _,
  Kibo,

  RiftSandbox,
  File,
  Sketch,

  Behaviors,
  Boid,
  World
) {
  'use strict';

  var SketchController = function() {
    this.hands = [];
    var setupVideoPassthrough = function () {
      this.domMonitor = document.getElementById('monitor');
      var getUserMedia = (
        (
          navigator.webkitGetUserMedia &&
          navigator.webkitGetUserMedia.bind(navigator)) ||
        navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices));
      getUserMedia(
        {video: {
          mandatory: {
            minWidth: 1280,
            minHeight: 720
          }
        }},
        function (stream) {
          this.domMonitor.src = window.URL.createObjectURL(stream);
        }.bind(this),
        function () {
          // video pass-through is optional.
        }
      );
    }.bind(this);
    setupVideoPassthrough();

    var loadSketch = function (ref) {
      this.firebaseRef = ref;
      ref.on('value', function (data) {
        this.readCode(data.val());
      }.bind(this));
    }.bind(this);

    var getShortcut = function (key) {
      key = key || '';
      return ['alt shift ' + key, 'ctrl shift ' + key];
    };

    this.is_editor_visible = true;
    this.bindKeyboardShortcuts = function (domTextArea, file) {
      var kibo = new Kibo(domTextArea);
      kibo.down(getShortcut('z'), function () {
        this.riftSandbox.controls.zeroSensor();
        return false;
      }.bind(this));
      kibo.down(getShortcut('e'), function () {
        this.is_editor_visible = !this.is_editor_visible;
        this.riftSandbox.toggleTextArea(this.is_editor_visible);
        return false;
      }.bind(this));
      kibo.down(getShortcut('u'), function () {
        spinNumberAndKeepSelection(-1, 10);
        return false;
      });
      kibo.down(getShortcut('i'), function () {
        spinNumberAndKeepSelection(1, 10);
        return false;
      });
      kibo.down(getShortcut('j'), function () {
        spinNumberAndKeepSelection(-1, 1);
        return false;
      });
      kibo.down(getShortcut('k'), function () {
        spinNumberAndKeepSelection(1, 1);
        return false;
      });
      kibo.down(getShortcut('n'), function () {
        spinNumberAndKeepSelection(-1, 0.1);
        return false;
      });
      kibo.down(getShortcut('m'), function () {
        spinNumberAndKeepSelection(1, 0.1);
        return false;
      });

      var MOVEMENT_RATE = 0.01;
      var ROTATION_RATE = 0.01;

      kibo.down('w', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.setVelocity(MOVEMENT_RATE);
        }
      }.bind(this));
      kibo.up('w', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.setVelocity(0);
        }
      }.bind(this));

      kibo.down('s', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.setVelocity(-MOVEMENT_RATE);
        }
      }.bind(this));
      kibo.up('s', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.setVelocity(0);
        }
      }.bind(this));

      kibo.down('a', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.BaseRotationEuler.y += ROTATION_RATE;
        }
      }.bind(this));
      kibo.down('d', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.BaseRotationEuler.y -= ROTATION_RATE;
        }
      }.bind(this));

      kibo.down('q', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.BaseRotationEuler.y += Math.PI / 4;
        }
      }.bind(this));
      kibo.down('e', function () {
        if (!this.is_editor_visible) {
          this.riftSandbox.BaseRotationEuler.y -= Math.PI / 4;
        }
      }.bind(this));

      kibo.down(getShortcut(), function () {
        if (this.shiftPressed) { return false; }
        this.shiftPressed = true;
        return false;
      }.bind(this));
      kibo.up('shift', function () {
        this.shiftPressed = false;
        return false;
      }.bind(this));

      kibo.down(getShortcut(), function () {
        if (this.modifierPressed) { return false; }
        var start = this.currentDomTextArea.selectionStart;
        file.recordOriginalNumberAt(start);
        this.handStart = this.handCurrent;
        this.modifierPressed = true;
        return false;
      }.bind(this));
      kibo.up(getShortcut(), function () {
        this.modifierPressed = false;
        return false;
      }.bind(this));
    }.bind(this);

    var setupDomTextArea = function (file) {
      var domTextArea = $('<textarea>').
        appendTo('body').
        on('keyup', function (e) {
          var contents = e.target.value;
          if (contents === file.contents) { return; }
          file.contents = contents;
          this.firebaseRef.set(this.sketch);
        }.bind(this)).
        on('keydown', function (e) {
          e.stopPropagation();
        }).
        get(0);
      this.bindKeyboardShortcuts(domTextArea, file);
      return domTextArea;
    }.bind(this);

    var setupSketch = function () {
      this.sketch = new Sketch('', [
        new File('Behaviors', Behaviors),
        new File('Boid', Boid),
        new File('World', World)
      ]);
      this.domTextAreas = this.sketch.files.map(setupDomTextArea);
      this.currentDomTextArea = this.domTextAreas[0];
      this.currentDomTextArea.focus();
      this.currentFile = this.sketch.files[0];

      var sketches_base = 'https://riftsketch2.firebaseio.com/sketches/';
      var ref;
      if (!window.location.hash) {
        ref = new Firebase(sketches_base);
        ref = ref.push(
          this.sketch,
          function () {
            window.location.hash = '#!' + ref.key();
            loadSketch(ref);
          }
        );
      }
      else {
        ref = new Firebase(sketches_base + window.location.hash.substring(2));
        loadSketch(ref);
      }
    }.bind(this);
    setupSketch();

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
        this.riftSandbox.setInfo(err.toString());
      }

      this.riftSandbox.render();
    };

    var spinNumberAndKeepSelection = function (direction, amount) {
      var start = this.domTextArea.selectionStart;
      File.spinNumberAt(this.sketch, start, direction, amount);
      this.writeCode(this.sketch.contents);
      this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
    }.bind(this);

    var offsetNumberAndKeepSelection = function (offset) {
      var start = this.domTextArea.selectionStart;
      File.offsetOriginalNumber(this.sketch, offset);
      this.writeCode(this.sketch.contents);
      this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
    }.bind(this);

    this.handStart = this.handCurrent = null;
    this.modifierPressed = this.shiftPressed = false;
    Leap.loop({}, function (frame) {
      if (frame.hands.length) {
        this.handCurrent = frame;
        if (this.modifierPressed && this.handStart) {
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

    var toggleVrMode = function () {
      if (
        !(document.mozFullScreenElement || document.webkitFullScreenElement) &&
        this.riftSandbox.vrMode
      ) {
        this.isInfullscreen = false;
        this.riftSandbox.toggleVrMode();
      }
      else {
        this.isInfullscreen = true;
      }
    }.bind(this);
    document.addEventListener('mozfullscreenchange', toggleVrMode, false);
    document.addEventListener('webkitfullscreenchange', toggleVrMode, false);

    $(function () {
      this.bindKeyboardShortcuts();
      this.riftSandbox = new RiftSandbox(
        window.innerWidth, window.innerHeight,
        this.domTextAreas,
        this.domMonitor,
        function (err) {
          this.seemsUnsupported = !!err;
        }.bind(this)
      );

      this.riftSandbox.interceptScene();

      this.readCode = function (sketch) {
        this.sketch.set(sketch);
        this.domTextAreas.forEach(function (domTextArea, i) {
          domTextArea.value = this.sketch.files[i].contents;
        }.bind(this));

        this.riftSandbox.clearScene();
        var _sketchLoop;
        this.riftSandbox.setInfo('');
        try {
          /* jshint -W054 */
          var _sketchFunc = new Function(
            'scene', 'camera', 'api',
            '"use strict";\n' + this.sketch.getCode()
          );
          /* jshint +W054 */
          _sketchLoop = _sketchFunc(
            this.riftSandbox.scene, this.riftSandbox.cameraPivot, api);
        }
        catch (err) {
          this.riftSandbox.setInfo(err.toString());
        }
        if (_sketchLoop) {
          this.sketchLoop = _sketchLoop;
        }
      }.bind(this);

      window.addEventListener(
        'resize',
        this.riftSandbox.resize.bind(this.riftSandbox),
        false
      );

      var kibo = new Kibo(this.domTextArea);
      kibo.down(getShortcut('v'), function () {
        this.riftSandbox.toggleVrMode();
        this.riftSandbox.vrManager.toggleVRMode();
        return false;
      }.bind(this));

      this.riftSandbox.resize();

      this.mainLoop();
    }.bind(this));
  };

  return SketchController;
});
