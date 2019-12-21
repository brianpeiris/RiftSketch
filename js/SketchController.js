import * as THREE from "three";
import WebFont from "webfontloader";

import KeyboardHandler from "./KeyboardHandler";
import RiftSandbox from "./RiftSandbox";
import File from "./File";
import Sketch from "./Sketch";

import Cube from "raw-loader!./Files/Cube.js";

export default class SketchController {
  constructor() {
    this.hands = [];
    this.setupVideoPassthrough();

    this.keyboardHandler = new KeyboardHandler(this);

    this.sketchLoop = function() {};

    WebFont.load({
      google: { families: ["Ubuntu Mono"] },
      active: () => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => this.init());
        } else {
          this.init();
          document.getElementById("loading").style.display = "none";
        }
      }
    });

    this.setupDomTextArea = this.setupDomTextArea.bind(this);
    this.mainLoop = this.mainLoop.bind(this);
    this.focusCurrentTextArea = this.focusCurrentTextArea.bind(this);
  }

  setupVideoPassthrough() {
    this.domMonitor = document.getElementById("monitor");
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        this.domMonitor.srcObject = stream;
      })
      .catch(e => {
        console.info("Could not get video passthrough", e);
      });
  }

  initializeSketch() {
    this.sketch = new Sketch("", [new File("Cube", Cube)]);
    this.domTextAreas = this.sketch.files.map(this.setupDomTextArea);
    this.currentDomTextArea = this.domTextAreas[0];
    this.currentDomTextArea.focus();
    this.currentFile = this.sketch.files[0];
    this.riftSandbox.setTextAreas(this.domTextAreas);
    this.riftSandbox.interceptScene();
  }

  setupDomTextArea(file) {
    const domTextArea = document.createElement("textarea");
    domTextArea.id = file.name;
    domTextArea.addEventListener("keyup", e => {
      const contents = e.target.value;
      if (contents === file.contents) {
        return;
      }
      file.contents = contents;
      this.readCode();
    });
    domTextArea.addEventListener("keydown", e => {
      e.stopPropagation();
    });
    document.body.append(domTextArea);
    this.keyboardHandler.bindKeyboardShortcuts(domTextArea, file);
    return domTextArea;
  }

  mainLoop() {
    window.requestAnimationFrame(this.mainLoop);

    try {
      this.sketchLoop();
    } catch (err) {
      console.log("Sketch Error", err);
      this.riftSandbox.setInfo(err.toString());
    }

    this.riftSandbox.render();
  }

  readCode() {
    this.domTextAreas.forEach((domTextArea, i) => {
      domTextArea.value = this.sketch.files[i].contents;
    });

    this.riftSandbox.clearScene();
    let _sketchLoop;
    this.riftSandbox.setInfo("");
    try {
      const _sketchFunc = new Function("THREE", "scene", "camera", "sketch", '"use strict";\n' + this.sketch.getCode());
      _sketchFunc(THREE, this.riftSandbox.scene, this.riftSandbox.cameraPivot, this.sketch);
      _sketchLoop = this.sketch.loop;
    } catch (err) {
      console.log("Sketch Error", err);
      this.riftSandbox.setInfo(err.toString());
    }
    if (_sketchLoop) {
      this.sketchLoop = _sketchLoop;
    }
  }

  startRecordingMousePos() {
    this.mousePos = { x: 0, y: 0 };
    window.addEventListener(
      "mousemove",
      e => {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
      },
      false
    );
  }

  spinNumberAndKeepSelection(domTextArea, file, direction, amount) {
    const start = domTextArea.selectionStart;
    file.spinNumberAt(start, direction, amount);
    domTextArea.selectionStart = domTextArea.selectionEnd = start;
  }

  offsetNumberAndKeepSelection(domTextArea, file, offset) {
    const start = domTextArea.selectionStart;
    file.offsetOriginalNumber(offset);
    domTextArea.selectionStart = domTextArea.selectionEnd = start;
  }

  resetSensor() {
    this.riftSandbox.resetSensor();
  }

  startVrMode() {
    this.riftSandbox.startVrMode();
  }

  initializeUnsupportedModal() {
    // TODO Determine VR support
    const supportsVR = false;
    if (!supportsVR && !localStorage.getItem("alreadyIgnoredUnsupported")) {
      // TODO Unsupported UI
    }
  }

  init() {
    this.riftSandbox = new RiftSandbox(window.innerWidth, window.innerHeight, this.domMonitor);
    this.initializeSketch();
    this.readCode();
    this.keyboardHandler.riftSandbox = this.riftSandbox;
    this.keyboardHandler.bindKeyboardShortcuts(document);

    const focusCurrentTextArea = this.focusCurrentTextArea;
    // TODO Focus on VR entry or fullscreen
    document.body.addEventListener("click", focusCurrentTextArea);

    this.initializeUnsupportedModal();

    window.addEventListener("resize", this.riftSandbox.resize, false);

    this.riftSandbox.resize();

    this.mainLoop();

    if (location.search.indexOf("vr=on") !== -1) {
      this.startVrMode();
    }
  }

  toggleTextAreas() {
    if (this.riftSandbox.areTextAreasVisible) {
      this.currentDomTextArea.blur();
    } else {
      this.focusCurrentTextArea();
    }
    this.riftSandbox.toggleTextAreas();
  }

  focusCurrentTextArea() {
    this.currentDomTextArea.focus();
  }

  getCurrentSelectionStart() {
    return this.currentDomTextArea.selectionStart;
  }
}
