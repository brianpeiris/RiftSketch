import Kibo from "@brianpeiris/kibo";

const getShortcut = function(key) {
  key = key || "";
  return ["alt shift " + key, "ctrl shift " + key];
};

export default class KeyboardHandler {
  constructor(sketchController) {
    this._sketchController = sketchController;
  }

  _bindNumberShortcuts(domTextArea, file, kibo) {
    kibo.down(getShortcut("u"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 10);
      return false;
    });
    kibo.down(getShortcut("i"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 10);
      return false;
    });
    kibo.down(getShortcut("j"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 1);
      return false;
    });
    kibo.down(getShortcut("k"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 1);
      return false;
    });
    kibo.down(getShortcut("n"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, -1, 0.1);
      return false;
    });
    kibo.down(getShortcut("m"), () => {
      this._sketchController.spinNumberAndKeepSelection(domTextArea, file, 1, 0.1);
      return false;
    });
  }

  bindKeyboardShortcuts(domTextArea, file) {
    const kibo = new Kibo(domTextArea);
    kibo.down(getShortcut("z"), () => {
      this._sketchController.resetSensor();
      return false;
    });
    kibo.down(getShortcut("e"), () => {
      this._sketchController.toggleTextAreas();
      return false;
    });
    kibo.down(getShortcut("r"), () => {
      this.riftSandbox.toggleMonitor();
      return false;
    });

    kibo.down(getShortcut("v"), () => {
      this._sketchController.startVrMode();
      return false;
    });

    if (file) {
      this._bindNumberShortcuts(domTextArea, file, kibo);
    }
  }
}
