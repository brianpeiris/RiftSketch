define([
  'firebase',
  'jquery',
  'leap',
  'leapjsplugins',
  'oauth',
  'lodash',

  'js/KeyboardHandler',
  'js/RiftSandbox',
  'js/File',
  'js/Sketch',
  'js/UnsupportedModal',

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

  KeyboardHandler,
  RiftSandbox,
  File,
  Sketch,
  UnsupportedModal,

  Behaviors,
  Boid,
  World
) {
  'use strict';

  var SketchController = function() {
    this.hands = [];
    this.setupVideoPassthrough();

    this.is_editor_visible = true;
    this.keyboardHandler = new KeyboardHandler();
    this.setupSketch();

    this.sketchLoop = function () {};
    this.startLeapMotionLoop();

    document.addEventListener('mozfullscreenchange', this.toggleVrMode.bind(this), false);
    document.addEventListener('webkitfullscreenchange', this.toggleVrMode.bind(this), false);

    $(document).ready(this.init.bind(this));
  };

  SketchController.prototype.setupVideoPassthrough = function () {
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
  };

  SketchController.prototype.loadSketch = function (ref) {
    this.firebaseRef = ref;
    ref.on('value', function (data) {
      this.readCode(data.val());
    }.bind(this));
  };

  SketchController.prototype.setupDomTextArea = function (file) {
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
    this.keyboardHandler.bindKeyboardShortcuts(domTextArea, file);
    return domTextArea;
  };

  SketchController.prototype.setupSketch = function () {
    this.sketch = new Sketch('', [
      new File('Behaviors', Behaviors),
      new File('Boid', Boid),
      new File('World', World)
    ]);
    this.domTextAreas = this.sketch.files.map(this.setupDomTextArea.bind(this));
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
          this.loadSketch(ref);
        }.bind(this)
      );
    }
    else {
      ref = new Firebase(sketches_base + window.location.hash.substring(2));
      this.loadSketch(ref);
    }
  };

  SketchController.prototype.mainLoop = function () {
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

  SketchController.prototype.readCode = function (sketch) {
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
        'scene', 'camera', 
        '"use strict";\n' + this.sketch.getCode()
      );
      /* jshint +W054 */
      _sketchLoop = _sketchFunc(
        this.riftSandbox.scene, this.riftSandbox.cameraPivot);
    }
    catch (err) {
      this.riftSandbox.setInfo(err.toString());
    }
    if (_sketchLoop) {
      this.sketchLoop = _sketchLoop;
    }
  };

  SketchController.prototype.startRecordingMousePos = function () {
    this.mousePos = {x: 0, y: 0};
    window.addEventListener(
      'mousemove',
      function (e) {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
      }.bind(this),
      false
    );
  };

  SketchController.prototype.spinNumberAndKeepSelection = function (direction, amount) {
    var start = this.domTextArea.selectionStart;
    File.spinNumberAt(this.sketch, start, direction, amount);
    this.writeCode(this.sketch.contents);
    this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
  };

  SketchController.prototype.offsetNumberAndKeepSelection = function (offset) {
    var start = this.domTextArea.selectionStart;
    File.offsetOriginalNumber(this.sketch, offset);
    this.writeCode(this.sketch.contents);
    this.domTextArea.selectionStart = this.domTextArea.selectionEnd = start;
  };

  SketchController.prototype.handleLeapMotionFrame = function (frame) {
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
  };

  SketchController.prototype.startLeapMotionLoop = function () {
    this.handStart = this.handCurrent = null;
    this.modifierPressed = this.shiftPressed = false;
    Leap.loop({}, this.handleLeapMotionFrame.bind(this));
  };

  SketchController.prototype.initializeApiAccess = function () {
    OAuth.initialize('bnVXi9ZBNKekF-alA1aF7PQEpsU');
    var apiCache = {};
    this.api = _.throttle(function (provider, url, data, callback) {
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
  };

  SketchController.prototype.toggleVrMode = function () {
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
  };

  SketchController.prototype.initializeUnsupportedModal = function () {
    this.riftSandbox.vrManager.on('initialized', function () {
      if (
        !this.riftSandbox.vrManager.isVRCompatible &&
        !localStorage.getItem('alreadyIgnoredUnsupported')
      ) {
        $(document.body).append(new UnsupportedModal().render().el);
      }
    }.bind(this));
  };

  SketchController.prototype.init = function () {
    this.keyboardHandler.bindKeyboardShortcuts();
    this.riftSandbox = new RiftSandbox(
      window.innerWidth, window.innerHeight,
      this.domTextAreas,
      this.domMonitor
    );

    this.initializeUnsupportedModal();

    this.riftSandbox.interceptScene();

    window.addEventListener(
      'resize',
      this.riftSandbox.resize.bind(this.riftSandbox),
      false
    );

    this.riftSandbox.resize();

    this.mainLoop();
  };

  return SketchController;
});
