define([
  'three'
],
function (
  THREE
) {
  'use strict';
  var FONT_SIZE_PX = 40;
  var NUM_LINES = 20;
  var CANVAS_SIZE_PX = NUM_LINES * FONT_SIZE_PX + FONT_SIZE_PX * 0.2;
  var UPDATE_INTERVAL_MS = 500;
  var constr = function (domTextArea) {
    this.domTextArea = domTextArea;

    this.canvasSize = CANVAS_SIZE_PX;
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = this.canvasSize;

    this.context = canvas.getContext('2d');
    this.context.font = FONT_SIZE_PX + 'px Ubuntu Mono, monospace';
    this.context.globalCompositeOperation = 'darker';
    var textMetrics = this.context.measureText('0');
    this.charWidth = textMetrics.width;
    this.numCols = Math.floor(CANVAS_SIZE_PX / this.charWidth);

    this.viewPort = {
      line: 0, col: 0
    };

    this.textTexture = new THREE.Texture(canvas);
    this.textTexture.needsUpdate = true;
    this.textTexture.minFilter = THREE.LinearFilter;

    var textAreaMat = new THREE.MeshBasicMaterial(
      {map: this.textTexture, side: THREE.DoubleSide});
    textAreaMat.transparent = true;

    this.object = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2),
      new THREE.MeshBasicMaterial(textAreaMat));
    this.object.position.y = 1.5;

    this.grabHandle = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({wireframe: true})
    );
    this.grabHandle.position.set(0.8, -1.2, -0.05);
    var grabHandleCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.15),
      new THREE.MeshLambertMaterial()
    );
    this.grabHandle.add(grabHandleCube);
    this.object.add(this.grabHandle);

    this.setupInfoPane();

    this.lastUpdate = Date.now();
    this.isBlinkOff = false;
  };

  constr.prototype.setupInfoPane = function () {
    var canvas = document.createElement('canvas');
    canvas.width = this.canvasSize;
    canvas.height = 200;

    this.infoContext = canvas.getContext('2d');
    this.infoContext.font = FONT_SIZE_PX + 'px Ubuntu Mono, monospace';
    this.infoContext.fillStyle = 'hsla(200, 50%, 90%, 0.9)';
    this.infoContext.fillRect(0, 0, this.canvasSize, this.canvasSize);
    this.infoContext.fillStyle = 'hsl(0, 0%, 25%)';
    this.infoContext.fillText('Alt/Ctrl + Shift + ...', 0, FONT_SIZE_PX * 2);
    this.infoContext.fillText('v: VR | z: reset | e: editor | r: webcam', 0, FONT_SIZE_PX * 3);
    this.infoContext.fillText('j/k, u/i, n/m - change number', 0, FONT_SIZE_PX * 4);

    this.infoTexture = new THREE.Texture(canvas);
    this.infoTexture.needsUpdate = true;
    this.infoTexture.minFilter = THREE.LinearFilter;

    var infoMat = new THREE.MeshBasicMaterial(
      {map: this.infoTexture, side: THREE.DoubleSide});
    infoMat.transparent = true;

    var infoMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 0.5),
      new THREE.MeshBasicMaterial(infoMat));
    infoMesh.position.y = -1.3;

    this.object.add(infoMesh);
  };

  constr.prototype.setInfo = function (msg) {
    this.infoContext.clearRect(0, 0, this.canvasSize, FONT_SIZE_PX * 1.2);
    this.infoContext.fillStyle = 'hsla(200, 50%, 90%, 0.9)';
    this.infoContext.fillRect(0, 0, this.canvasSize, FONT_SIZE_PX * 1.2);
    this.infoContext.fillStyle = 'hsl(0, 50%, 50%)';
    this.infoContext.fillText(msg, 0, FONT_SIZE_PX);
    this.infoTexture.needsUpdate = true;
  };

  constr.prototype.toggle = function (shouldBeVisible) {
    this.object.visible = shouldBeVisible;
  };

  constr.prototype.getLines = function (){
    var start = this.domTextArea.selectionStart;
    var end = this.domTextArea.selectionEnd;

    var charsSeen = 0, charsSeenWithNewLines = 0;

    var lines = this.domTextArea.value.split('\n');
    return lines.map(function (line) {
      var isLineSelected = (
        start <= charsSeenWithNewLines + line.length &&
        end >= charsSeenWithNewLines);

      var lineStart = 0, lineEnd = line.length;
      if (isLineSelected) {
        if (start >= charsSeenWithNewLines) {
          lineStart = start - charsSeenWithNewLines;
        }
        if (end <= charsSeenWithNewLines + line.length) {
          lineEnd = end - charsSeenWithNewLines;
        }
      }
      else {
        lineStart = lineEnd = null;
      }

      charsSeenWithNewLines += line.length + 1;
      charsSeen += line.length;

      var lineObj = {
        text: line,
        selectionStart:  lineStart,
        selectionEnd: lineEnd
      };

      return lineObj;
    });
  };

  constr.prototype.shouldUpdateTexture = function () {
    if (Date.now() - this.lastUpdate > UPDATE_INTERVAL_MS) {
      this.lastUpdate = Date.now();
      return true;
    }
    var newText = this.domTextArea.value;
    if (this.oldText !== newText) {
      this.oldText = this.domTextArea.value;
      return true;
    }
    var newStart = this.domTextArea.selectionStart;
    if (this.oldStart !== newStart) {
      this.oldStart = newStart;
      return true;
    }
    var newEnd = this.domTextArea.selectionEnd;
    if (this.oldEnd !== newEnd) {
      this.oldEnd = newEnd;
      return true;
    }
  };

  constr.prototype.updateViewport = function (hasStartChanged, lines) {
    var position = hasStartChanged ?
      this.domTextArea.selectionStart : this.domTextArea.selectionEnd;
    var substring = this.domTextArea.value.substring(0, position);
    var linesUpToPosition = substring.match(/\n/g) || [];
    var line = linesUpToPosition.length + 1;
    if (line < this.viewPort.line + 1) {
      this.viewPort.line = line - 1;
    }
    else if (line > this.viewPort.line + NUM_LINES) {
      this.viewPort.line = line - NUM_LINES;
    }

    line = lines[line - 1];
    var col = hasStartChanged ?  line.selectionStart : line.selectionEnd;
    if (col < this.viewPort.col) {
      this.viewPort.col = col;
    }
    else if (col > this.viewPort.col + this.numCols) {
      this.viewPort.col = col - this.numCols;
    }
  };

  constr.prototype.update = function () {
    var hasStartChanged = this.domTextArea.selectionStart != this.oldStart;
    if (!this.shouldUpdateTexture()) { return; }

    var lines = this.getLines(this.domTextArea);
    this.updateViewport(hasStartChanged, lines);

    this.context.clearRect(0, 0, this.canvasSize, this.canvasSize);
    this.context.fillStyle = 'hsla(0, 0%, 100%, 0.8)';
    this.context.fillRect(0, 0, this.canvasSize, this.canvasSize);

    for (var i = this.viewPort.line; i < Math.min(this.viewPort.line + NUM_LINES, lines.length); i++){
      var j = i - this.viewPort.line;
      var line = lines[i];
      this.context.fillStyle = 'hsl(0, 0%, 25%)';
      var lineText = line.text.substring(
        this.viewPort.col, this.viewPort.col + this.numCols);
      this.context.fillText(lineText, 0, FONT_SIZE_PX + FONT_SIZE_PX * j);

      if (line.selectionStart === null) { continue; }

      this.context.fillStyle = 'rgba(100, 100, 200, 0.8)';
      var width = (line.selectionEnd - line.selectionStart) * this.charWidth;
      if (width === 0) {
        width = 5;
        var nextLine = lines[i + 1];
        var isLastSelectedLine = (
          !nextLine ||
          nextLine.selectionStart === null);
        if (isLastSelectedLine && this.isBlinkOff) {
          continue;
        }
      }
      this.context.fillRect(
        (line.selectionStart - this.viewPort.col) * this.charWidth,
        0.2 * FONT_SIZE_PX + FONT_SIZE_PX * j,
        width,
        FONT_SIZE_PX);
    }
    this.isBlinkOff = !this.isBlinkOff;
    this.textTexture.needsUpdate = true;
  };
  return constr;
});
