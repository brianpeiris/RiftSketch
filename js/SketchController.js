import * as THREE from "three";
import WebFont from "webfontloader";

import KeyboardHandler from "./KeyboardHandler";
import RiftSandbox from "./RiftSandbox";
import File from "./File";
import Sketch from "./Sketch";

import Cube from "raw-loader!./Files/Cube.js";

export default class SketchController {
  constructor() {
    //this._setupVideoPassthrough();

    this._keyboardHandler = new KeyboardHandler(this);

    this._sketchLoop = function() {};

    WebFont.load({
      google: { families: ["Ubuntu Mono"] },
      active: () => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this._init());
        } else {
          this._init();
          document.getElementById("loading").style.display = "none";
        }
      }
    });

    this._setupDomTextArea = this._setupDomTextArea.bind(this);
    this._mainLoop = this._mainLoop.bind(this);
    this._focusCurrentTextArea = this._focusCurrentTextArea.bind(this);
  }

  _setupVideoPassthrough() {
    this._domMonitor = document.getElementById("monitor");
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(stream => {
          this._domMonitor.srcObject = stream;
        })
        .catch(e => {
          console.info("Could not get video passthrough", e);
        });
    }
  }

  _initializeSketch() {
    const storedSketches = localStorage.getItem("sketches_v1");
    if (storedSketches) {
      this._sketch = Sketch.fromJSON(JSON.parse(storedSketches)[0]);
    } else {
      this._sketch = new Sketch("", [new File("Cube", Cube)]);
    }
    this._domTextAreas = this._sketch.files.map(this._setupDomTextArea);
    this._currentDomTextArea = this._domTextAreas[0];
    this._currentDomTextArea.focus();
    this._riftSandbox.setTextAreas(this._domTextAreas);
    this._riftSandbox.interceptScene();
  }

  _setupDomTextArea(file) {
    const domTextArea = document.createElement("textarea");
    domTextArea.id = file.name;
    domTextArea.addEventListener("keyup", e => {
      const contents = e.target.value;
      if (contents === file.contents) {
        return;
      }
      file.contents = contents;
      this._readCode();
    });
    domTextArea.addEventListener("keydown", e => {
      e.stopPropagation();
    });
    document.body.append(domTextArea);
    this._keyboardHandler.bindKeyboardShortcuts(domTextArea, file);
    return domTextArea;
  }

  _mainLoop() {
    try {
      this._sketchLoop();
    } catch (err) {
      console.log("Sketch Error", err);
      this._riftSandbox.setInfo(err.toString());
    }

    this._riftSandbox.render();
  }

  _readCode() {
    localStorage.setItem("sketches_v1", JSON.stringify([this._sketch.toJSON()]));
    this._domTextAreas.forEach((domTextArea, i) => {
      domTextArea.value = this._sketch.files[i].contents;
    });

    this._riftSandbox.clearScene();
    let _sketchLoop;
    this._riftSandbox.setInfo("");
    try {
      const _sketchFunc = new Function(
        "THREE",
        "scene",
        "camera",
        "sketch",
        "renderer",
        '"use strict";\n' + this._sketch.getCode()
      );
      _sketchFunc(
        THREE,
        this._riftSandbox.scene,
        this._riftSandbox.cameraPivot,
        this._sketch,
        this._riftSandbox.renderer
      );
      _sketchLoop = this._sketch.loop;
    } catch (err) {
      console.log("Sketch Error", err);
      this._riftSandbox.setInfo(err.toString());
    }
    if (_sketchLoop) {
      this._sketchLoop = _sketchLoop;
    }

    this._sketch.initialized = true;
  }

  spinNumberAndKeepSelection(domTextArea, file, direction, amount) {
    const start = domTextArea.selectionStart;
    file.spinNumberAt(start, direction, amount);
    this._readCode();
    domTextArea.selectionStart = domTextArea.selectionEnd = start;
  }

  resetSensor() {
    this._riftSandbox.resetSensor();
  }

  startVrMode() {
    this._riftSandbox.startVrMode();
  }

  _initializeUnsupportedModal() {
    // TODO Determine VR support
    const supportsVR = false;
    if (!supportsVR && !localStorage.getItem("alreadyIgnoredUnsupported")) {
      // TODO Unsupported UI
    }
  }

  _init() {
    this._riftSandbox = new RiftSandbox(window.innerWidth, window.innerHeight, this._domMonitor);
    this._initializeSketch();
    this._readCode();
    this._keyboardHandler.riftSandbox = this._riftSandbox;
    this._keyboardHandler.bindKeyboardShortcuts(document);

    // TODO Focus on VR entry or fullscreen
    document.body.addEventListener("click", this._focusCurrentTextArea);

    this._initializeUnsupportedModal();

    window.addEventListener("resize", this._riftSandbox.resize, false);

    this._riftSandbox.resize();

    this._riftSandbox.renderer.setAnimationLoop(this._mainLoop);

    if (location.search.indexOf("vr=on") !== -1) {
      this.startVrMode();
    }
  }

  toggleTextAreas() {
    if (this._riftSandbox.areTextAreasVisible) {
      this._currentDomTextArea.blur();
    } else {
      this._focusCurrentTextArea();
    }
    this._riftSandbox.toggleTextAreas();
  }

  _focusCurrentTextArea() {
    this._currentDomTextArea.focus();
  }

  getCurrentSelectionStart() {
    return this._currentDomTextArea.selectionStart;
  }
}
