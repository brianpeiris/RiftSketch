define([
  'firebase',
  'jquery',
  'leapjs',
  'leapjs-plugins',
  'lodash',
  'three',

  './KeyboardHandler',
  './RiftSandbox',
  './File',
  './Sketch',
  './UnsupportedModal',

  'raw!./Files/Cube.js',
],
function (
  Firebase,
  $,
  Leap,
  leapjsplugins,
  _,
  THREE,

  KeyboardHandler,
  RiftSandbox,
  File,
  Sketch,
  UnsupportedModal,

  Cube
) {
  'use strict';

  var constr = function() {
    this.hands = [];
    this.setupVideoPassthrough();

    this.keyboardHandler = new KeyboardHandler(this);

    this.sketchLoop = function () {};
    this.startLeapMotionLoop();

    $(document).ready(this.init.bind(this));
  };

  constr.prototype.setupVideoPassthrough = function () {
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

  constr.prototype.initializeSketch = function (data) {
    this.sketch = new Sketch();
    this.sketch.set(data.val());
    this.domTextAreas = this.sketch.files.map(this.setupDomTextArea.bind(this));
    this.currentDomTextArea = this.domTextAreas[0];
    this.currentDomTextArea.focus();
    this.currentFile = this.sketch.files[0];
    this.riftSandbox.setTextAreas(this.domTextAreas);
    this.riftSandbox.interceptScene();
    this.firebaseRef.off('value', this.initializeSketch);
  };

  constr.prototype.loadSketch = function (ref) {
    this.firebaseRef = ref;
    this.initializeSketch = this.initializeSketch.bind(this);
    ref.on('value', this.initializeSketch);
    ref.on('value', function (data) {
      this.readCode(data.val());
    }.bind(this));
  };

  constr.prototype.setupDomTextArea = function (file) {
    var domTextArea = $('<textarea>').
      attr('id', file.name).
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

  constr.prototype.setupSketch = function () {
    var sketches_base = 'https://riftsketch2.firebaseio.com/sketches/';
    var ref;
    if (!window.location.hash) {
      this.sketch = new Sketch('', [ new File('Cube', Cube) ]);
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

  constr.prototype.mainLoop = function () {
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

  constr.prototype.readCode = function (sketch) {
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
        'THREE', 'scene', 'camera',
        '"use strict";\n' + this.sketch.getCode()
      );
      /* jshint +W054 */
      _sketchLoop = _sketchFunc(
        THREE, this.riftSandbox.scene, this.riftSandbox.cameraPivot);
    }
    catch (err) {
      this.riftSandbox.setInfo(err.toString());
    }
    if (_sketchLoop) {
      this.sketchLoop = _sketchLoop;
    }
  };

  constr.prototype.startRecordingMousePos = function () {
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

  constr.prototype.spinNumberAndKeepSelection = function (domTextArea, file, direction, amount) {
    var start = domTextArea.selectionStart;
    file.spinNumberAt(start, direction, amount);
    this.firebaseRef.set(this.sketch);
    domTextArea.selectionStart = domTextArea.selectionEnd = start;
  };

  constr.prototype.offsetNumberAndKeepSelection = function (domTextArea, file, offset) {
    var start = domTextArea.selectionStart;
    file.offsetOriginalNumber(offset);
    this.firebaseRef.set(this.sketch);
    domTextArea.selectionStart = domTextArea.selectionEnd = start;
  };

  constr.prototype.handleLeapMotionFrame = function (frame) {
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

  constr.prototype.startLeapMotionLoop = function () {
    this.handStart = this.handCurrent = null;
    this.modifierPressed = this.shiftPressed = false;
    Leap.loop({}, this.handleLeapMotionFrame.bind(this));
  };

  constr.prototype.initializeApiAccess = function () {
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

  constr.prototype.resetSensor = function () {
    this.riftSandbox.resetSensor();
  };

  constr.prototype.startVrMode = function () {
    this.riftSandbox.startVrMode();
  };

  constr.prototype.initializeUnsupportedModal = function () {
    this.riftSandbox.vrManager.on('initialized', function () {
      if (
        !this.riftSandbox.vrManager.isVRCompatible &&
        !localStorage.getItem('alreadyIgnoredUnsupported')
      ) {
        $(document.body).append(new UnsupportedModal().render().el);
      }
    }.bind(this));
  };

  constr.prototype.init = function () {
    this.riftSandbox = new RiftSandbox(
      window.innerWidth, window.innerHeight,
      this.domMonitor
    );
    this.setupSketch();
    this.keyboardHandler.riftSandbox = this.riftSandbox;
    this.keyboardHandler.bindKeyboardShortcuts(document);

    var focusCurrentTextArea = this.focusCurrentTextArea.bind(this);
    this.riftSandbox.vrManager.button.on('vr', focusCurrentTextArea);
    this.riftSandbox.vrManager.button.on('fs', focusCurrentTextArea);
    $(document.body).on('click', focusCurrentTextArea);

    this.initializeUnsupportedModal();

    window.addEventListener(
      'resize',
      this.riftSandbox.resize.bind(this.riftSandbox),
      false
    );

    this.riftSandbox.resize();

    this.mainLoop();

    if (location.search.indexOf('vr=on') !== -1) {
      this.startVrMode();
    }
  };

  constr.prototype.toggleTextAreas = function () {
    if (this.riftSandbox.areTextAreasVisible) {
      this.currentDomTextArea.blur();
    }
    else {
      this.focusCurrentTextArea();
    }
    this.riftSandbox.toggleTextAreas();
  };

  constr.prototype.focusCurrentTextArea = function () {
    this.currentDomTextArea.focus();
  };

  constr.prototype.getCurrentSelectionStart = function () {
    return this.currentDomTextArea.selectionStart;
  };

  return constr;
});
