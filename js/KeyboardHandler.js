define([
  'kibo'
], function (
  Kibo
) {
  var getShortcut = function (key) {
    key = key || '';
    return ['alt shift ' + key, 'ctrl shift ' + key];
  };

  var KeyboardHandler = function (sketchController) {
    this.sketchController = sketchController;
  };

  KeyboardHandler.prototype.bindMovementShortcuts = function (kibo) {
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
  };

  KeyboardHandler.prototype.bindNumberShortcuts = function (domTextArea, file, kibo) {
    kibo.down(getShortcut('u'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 10);
      return false;
    }.bind(this));
    kibo.down(getShortcut('i'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 10);
      return false;
    }.bind(this));
    kibo.down(getShortcut('j'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 1);
      return false;
    }.bind(this));
    kibo.down(getShortcut('k'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 1);
      return false;
    }.bind(this));
    kibo.down(getShortcut('n'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 0.1);
      return false;
    }.bind(this));
    kibo.down(getShortcut('m'), function () {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 0.1);
      return false;
    }.bind(this));
  };

  KeyboardHandler.prototype.bindKeyboardShortcuts = function (domTextArea, file) {
    var kibo = new Kibo(domTextArea);
    kibo.down(getShortcut('z'), function () {
      this.riftSandbox.controls.zeroSensor();
      return false;
    }.bind(this));
    kibo.down(getShortcut('e'), function () {
      this.sketchController.riftSandbox.toggleTextAreas();
      return false;
    }.bind(this));

    kibo.down(getShortcut('v'), function () {
      this.riftSandbox.toggleVrMode();
      this.riftSandbox.vrManager.toggleVRMode();
      return false;
    }.bind(this));

    this.bindNumberShortcuts(domTextArea, file, kibo);
    this.bindMovementShortcuts(kibo);

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
      var start = this.sketchController.getCurrentSelectionStart();
      file.recordOriginalNumberAt(start);
      this.handStart = this.handCurrent;
      this.modifierPressed = true;
      return false;
    }.bind(this));
    kibo.up(getShortcut(), function () {
      this.modifierPressed = false;
      return false;
    }.bind(this));
  };
  return KeyboardHandler;
});
