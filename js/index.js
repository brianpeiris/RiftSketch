require.config({
  waitSeconds: 30,
  baseUrl: '',
  paths: {
    firebase: 'bower_components/firebase/firebase',
    leap: 'lib/leap-0.6.3',
    oauth: 'bower_components/oauth-js/dist/oauth',
    lodash: 'bower_components/lodash/dist/lodash',
    kibo: 'lib/kibo',
    Three: 'lib/ThreeJS/Three',
    VRControls: 'lib/VRControls',
    VREffect: 'lib/VREffect',
    WebVRPolyfill: 'lib/webvr-polyfill',
    WebVRManager: 'lib/webvr-manager',

    RiftSandbox: 'js/RiftSandbox',
    TextArea: 'js/TextArea',
    File: 'js/File',
    Sketch: 'js/Sketch'
  },
  shim: {
    firebase: {exports: 'Firebase'},
    leap: {exports: 'Leap'},
    oauth: {exports: 'OAuth'},
    kibo: {exports: 'Kibo'},
    Three: {exports: 'THREE'},
    WebVRPolyfill: {deps: ['Three']},
    VRControls: {deps: ['Three']},
    VREffect: {deps: ['Three']},
    WebVRManager: {exports: 'WebVRManager'}
  }
});

require([
  'firebase',
  'leap',
  'oauth',
  'lodash',
  'kibo',

  'RiftSandbox',
  'File',
  'Sketch'
],
function (
  Firebase,
  Leap,
  OAuth,
  _,
  Kibo,

  RiftSandbox,
  File,
  Sketch
) {
  'use strict';

  var SketchController = function() {
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

    var loadSketch = function (ref) {
      this.sketch = {};
      this.firebaseRef = ref;
      ref.on('value', function (data) {
        this.updateCode(data.val().contents);
      }.bind(this));
    }.bind(this);

    var setupSketch = function () {
      var sketches_base = 'https://riftsketch2.firebaseio.com/sketches/';
      var ref;
      if (!window.location.hash) {
        ref = new Firebase(sketches_base);
        ref = ref.push(
          {contents: File.defaultContents},
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
        this.riftSandbox.textArea.setInfo(err.toString());
      }

      this.riftSandbox.render();
    };

    var spinNumberAndKeepSelection = function (direction, amount) {
      var start = this.domTextArea.selectionStart;
      File.spinNumberAt(this.sketch, start, direction, amount);
      this.updateCode(this.sketch.contents);
      this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
    }.bind(this);

    var offsetNumberAndKeepSelection = function (offset) {
      var start = this.domTextArea.selectionStart;
      File.offsetOriginalNumber(this.sketch, offset);
      this.updateCode(this.sketch.contents);
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

    this.is_editor_visible = true;
    this.bindKeyboardShortcuts = function () {
      var kibo = new Kibo(this.domTextArea);
      kibo.down('alt shift z', function () {
        this.riftSandbox.controls.zeroSensor();
        return false;
      }.bind(this));
      kibo.down('alt shift e', function () {
        this.is_editor_visible = !this.is_editor_visible;
        this.riftSandbox.toggleTextArea(this.is_editor_visible);
        return false;
      }.bind(this));
      kibo.down('alt shift u', function () {
        spinNumberAndKeepSelection(-1, 10);
        return false;
      });
      kibo.down('alt shift i', function () {
        spinNumberAndKeepSelection(1, 10);
        return false;
      });
      kibo.down('alt shift j', function () {
        spinNumberAndKeepSelection(-1, 1);
        return false;
      });
      kibo.down('alt shift k', function () {
        spinNumberAndKeepSelection(1, 1);
        return false;
      });
      kibo.down('alt shift n', function () {
        spinNumberAndKeepSelection(-1, 0.1);
        return false;
      });
      kibo.down('alt shift m', function () {
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

      kibo.down(['alt shift'], function () {
        if (this.shiftPressed) { return false; }
        this.shiftPressed = true;
        return false;
      }.bind(this));
      kibo.up('shift', function () {
        this.shiftPressed = false;
        return false;
      }.bind(this));

      kibo.down('alt shift', function () {
        if (this.altPressed) { return false; }
        var start = this.domTextArea.selectionStart;
        File.recordOriginalNumberAt(this.sketch, start);
        this.handStart = this.handCurrent;
        this.altPressed = true;
        return false;
      }.bind(this));
      kibo.up('alt shift', function () {
        this.altPressed = false;
        return false;
      }.bind(this));
    }.bind(this);

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
      this.domTextArea = document.querySelector('textarea');
      this.bindKeyboardShortcuts();
      var $domTextArea = $(this.domTextArea);
      $domTextArea.on('blur', function () {
        $domTextArea.focus();
        this.domTextArea.selectionStart = this.domTextArea.selectionEnd = 0;
      }.bind(this));
      $domTextArea.on('keydown', function (e) {
        // prevent VR polyfill from hijacking wasd.
        e.stopPropagation();
      });
      $domTextArea.focus();
      this.domTextArea.selectionStart = this.domTextArea.selectionEnd = 0;
      this.riftSandbox = new RiftSandbox(
        window.innerWidth, window.innerHeight, this.domTextArea,
        function (err) {
          this.seemsUnsupported = !!err;
        }.bind(this)
      );

      this.updateCode = function (code) {
        console.log('updating code');
        this.sketch.contents = code;
        this.domTextArea.value = code;
        this.firebaseRef.set({contents: code});
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

      }.bind(this);
      $('#sketchContents').on('keyup', function (e) {
        var code = e.target.value;
        if (code === this.sketch.contents) { return; }
        this.updateCode(code);
      }.bind(this));

      window.addEventListener(
        'resize',
        this.riftSandbox.resize.bind(this.riftSandbox),
        false
      );

      var kibo = new Kibo(this.domTextArea);
      kibo.down('alt shift v', function () {
        this.riftSandbox.toggleVrMode();
        this.riftSandbox.effect.startFullscreen();
        return false;
      }.bind(this));

      this.riftSandbox.resize();

      this.mainLoop();
    }.bind(this));
  };
  new SketchController();
});
