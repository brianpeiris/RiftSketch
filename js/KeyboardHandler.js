define([
  'kibo'
], function (
  Kibo
) {
  var getShortcut = function (key) {
    key = key || '';
    return ['alt shift ' + key, 'ctrl shift ' + key];
  };

  var KeyboardHandler = function () {
  };

  KeyboardHandler.prototype.bindKeyboardShortcuts = function (domTextArea, file) {
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

    kibo.down(getShortcut('v'), function () {
      this.riftSandbox.toggleVrMode();
      this.riftSandbox.vrManager.toggleVRMode();
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
  return KeyboardHandler;
});
