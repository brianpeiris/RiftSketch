import Kibo from "@brianpeiris/kibo";

const getShortcut = function(key) {
  key = key || "";
  return ["alt shift " + key, "ctrl shift " + key];
};

export default class KeyboardHandler {
  constructor(sketchController) {
    this.sketchController = sketchController;
  }

  bindMovementShortcuts(kibo) {
    const MOVEMENT_RATE = 0.01;
    const ROTATION_RATE = 0.01;

    kibo.down("w", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.setVelocity(MOVEMENT_RATE);
      }
    });
    kibo.up("w", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.setVelocity(0);
      }
    });

    kibo.down("s", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.setVelocity(-MOVEMENT_RATE);
      }
    });
    kibo.up("s", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.setVelocity(0);
      }
    });

    kibo.down("a", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.BaseRotationEuler.y += ROTATION_RATE;
      }
    });
    kibo.down("d", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.BaseRotationEuler.y -= ROTATION_RATE;
      }
    });

    kibo.down("q", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.BaseRotationEuler.y += Math.PI / 4;
      }
    });
    kibo.down("e", () => {
      if (!this.is_editor_visible) {
        this.riftSandbox.BaseRotationEuler.y -= Math.PI / 4;
      }
    });
  }

  bindNumberShortcuts(domTextArea, file, kibo) {
    kibo.down(getShortcut("u"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 10);
      return false;
    });
    kibo.down(getShortcut("i"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 10);
      return false;
    });
    kibo.down(getShortcut("j"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 1);
      return false;
    });
    kibo.down(getShortcut("k"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 1);
      return false;
    });
    kibo.down(getShortcut("n"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 0.1);
      return false;
    });
    kibo.down(getShortcut("m"), () => {
      this.sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 0.1);
      return false;
    });
  }

  bindKeyboardShortcuts(domTextArea, file) {
    const kibo = new Kibo(domTextArea);
    kibo.down(getShortcut("z"), () => {
      this.sketchController.resetSensor();
      return false;
    });
    kibo.down(getShortcut("e"), () => {
      this.sketchController.toggleTextAreas();
      return false;
    });
    kibo.down(getShortcut("r"), () => {
      this.riftSandbox.toggleMonitor();
      return false;
    });

    kibo.down(getShortcut("v"), () => {
      this.sketchController.startVrMode();
      return false;
    });

    if (file) {
      this.bindNumberShortcuts(domTextArea, file, kibo);
    }
    this.bindMovementShortcuts(kibo);

    kibo.down(getShortcut(), () => {
      if (this.shiftPressed) {
        return false;
      }
      this.shiftPressed = true;
      return false;
    });
    kibo.up("shift", () => {
      this.shiftPressed = false;
      return false;
    });

    kibo.down(getShortcut(), () => {
      if (this.modifierPressed) {
        return false;
      }
      const start = this.sketchController.getCurrentSelectionStart();
      if (file) {
        file.recordOriginalNumberAt(start);
      }
      this.handStart = this.handCurrent;
      this.modifierPressed = true;
      return false;
    });
    kibo.up(getShortcut(), () => {
      this.modifierPressed = false;
      return false;
    });
  }
}
