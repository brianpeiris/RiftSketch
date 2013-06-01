require(
['ThreeJS', 'jquery', 'js/RiftClient', 'js/RiftSandbox', 'js/Editor', 'Firebase', 'js/RiftSketch'],
function (THREE, $, RiftClient, RiftSandbox, Editor, Firebase, RiftSketch) {
'use strict';

// TODO: Reinstate keyboard, mouse, gamepad functionality
/*
// Parameters
// ----------------------------------------------
var MOVING_MOUSE = false;
var MOUSE_SPEED = 0.005;
var KEYBOARD_SPEED = 0.02;
var GAMEPAD_SPEED = 0.04;

var lastButton = 0;
function getGamepadEvents() {
  var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
  if (gamepadSupportAvailable) {
    var gamepads = navigator.webkitGetGamepads();
    for (var i = 0; i < gamepads.length; ++i)
    {
        var pad = gamepads[i];
        if (pad) {
          lastButton = pad.buttons[0];
          moveVector.set(-pad.axes[1]*GAMEPAD_SPEED, -pad.axes[0]*GAMEPAD_SPEED, 0.0);
        }
    }
  }
}
*/

var codeErr;
var codeLoop = function () {};

var App = function () {
  this.firebase = new Firebase('https://riftsandbox.firebaseIO.com/sketches/');
  this.params = this.getParams();
  if (this.params.s === undefined) {
    this.sketch = this.firebase.push(new RiftSketch(), this.redirectToSketch.bind(this));
    return;
  }
  else {
    this.sketch = this.firebase.child(this.params.s);
    this.sketch.once('value', this.init.bind(this));
  }
};

App.prototype.redirectToSketch = function () {
  window.location.href = '?s=' + this.sketch.name();
};

App.prototype.init = function () {
  this.editor = new Editor(this.sketch, $('.editor'), this.executeEditorCode.bind(this));

  this.riftSandbox = new RiftSandbox(window.innerWidth, window.innerHeight);

  this.riftClient = new RiftClient(
    this.riftSandbox.setHmdRotation.bind(this.riftSandbox));

  this.externalTrackerCheckbox = $('#extt');
  this.externalTrackerCheckbox.
    prop('checked', this.riftClient.enabled).
    change(this.toggleRiftClient.bind(this));

  this.webSocketAddressInput = $('#wsock');
  this.webSocketAddressInput.change(this.updateWebSocketAddress.bind(this));

  window.addEventListener(
    'resize',
    this.riftSandbox.resize.bind(this.riftSandbox),
    false
  );

  this.showSettings = false;

  if (this.params.sock !== undefined) {
    this.riftClient.setWebSocketAddress(this.params.sock);
    this.riftClient.enabled = true;
  }
  if (this.params.heading !== undefined) {
    // TODO: fix me
    BaseRotationEuler.set(
      0.0,
      angleRangeRad(THREE.Math.degToRad(-parseFloat(this.params.heading))),
      0.0);
    BaseRotation.setFromEuler(BaseRotationEuler, 'YZX');
  }

  if (!this.showSettings) {
    $('#settings').hide();
  }

  if (this.riftClient.enabled) {
    this.riftClient.init();
  }

  this.mainLoop();
};

App.prototype.executeEditorCode = function (code) {
  this.riftSandbox.clearScene();

  this.editor.setError('');

  try { 
    var codeFunc = new Function('scene', 'THREE', code);
    var retVal = codeFunc(
      this.riftSandbox.scene, THREE) || {loop: function () {}};
    codeLoop = retVal.loop;
  }
  catch (err) {
    console.log(err);
    this.editor.setError(err);
  }
};

App.prototype.toggleRiftClient = function () {
  this.riftClient.enabled = this.externalTrackerCheckbox.is(':checked');
  if (this.riftClient.enabled) {
    this.riftClient.setWebSocketAddress($('#wsock').val());
    this.riftClient.init();
  }
  else {
    this.riftClient.closeConnection();
  }
};

App.prototype.updateWebSocketAddress = function () {
  this.riftClient.setWebSocketAddress(this.webSocketAddressInput.val());
  if (this.riftClient.enabled) {
    this.riftClient.closeConnection();
    this.riftClient.init();
  }
};

App.prototype.mainLoop = function () {
  window.requestAnimationFrame( this.mainLoop.bind(this) );

  this.editor.syncScroll();

  // Apply movement
  this.riftSandbox.setBaseRotation();
  this.riftSandbox.updateCameraRotation();

  try {
    codeLoop();
  }
  catch (err) {
    console.log(err);
    if (codeErr !== err) {
      this.editor.setError(err);
      codeError = err;
    }
  }

  this.riftSandbox.render();
};

App.prototype.getParams = function () {
  var params = {};
  var items = window.location.search.substring(1).split("&");
  for (var i = 0; i < items.length; i++) {
    var kvpair = items[i].split("=");
    params[kvpair[0]] = unescape(kvpair[1]);
  }
  return params;
};

$(document).ready(function() {
  new App();
});

});
