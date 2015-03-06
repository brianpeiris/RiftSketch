define([
],
function (
) {
  var File = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents === undefined ? defaultContents : contents;
    this.selected = true;
  };
  File.defaultContents = ('\
    var t3 = THREE;\n\
    var light = new t3.PointLight();\n\
    light.position.set(1, 1, 1);\n\
    scene.add(light);\n\
    \n\
    var makeCube = function (x, y, z) {\n\
      var cube = new t3.Mesh(\n\
        new t3.BoxGeometry(1, 1.1, 1),\n\
        new t3.MeshLambertMaterial(\n\
          {color: \'red\'})\n\
      );\n\
      cube.position.set(0, 0, 0).add(\n\
        new t3.Vector3(x, y, z));\n\
      scene.add(cube);\n\
      return cube;\n\
    };\n\
    \n\
    var cube = makeCube(0, 2, 2);\n\
    var i = 0;\n\
    return function () {\n\
      i += -0.02;\n\
      cube.rotation.y = i;\n\
    };\
  '.replace(/\n {4}/g, '\n').replace(/^\s+|\s+$/g, ''));
  File.findNumberAt = function (sketch, index) {
    return sketch.contents.substring(index).match(/-?\d+\.?\d*/)[0];
  };
  File.spinNumber = function (number, direction, amount) {
    if (number.indexOf('.') === -1) {
      return (parseInt(number, 10) + direction * amount).toString();
    }
    else {
      return (parseFloat(number) + direction * amount).toFixed(2);
    }
  };
  File.spinNumberAt = function (
    sketch, index, direction, amount, originalNumber
  ) {
    var number = File.findNumberAt(sketch, index);
    originalNumber = originalNumber || number;
    var newNumber = File.spinNumber(originalNumber, direction, amount);
    sketch.contents = (
      sketch.contents.substring(0, index) +
      newNumber +
      sketch.contents.substring(index + number.length)
    );
  };
  File.recordOriginalNumberAt = function (sketch, index) {
    File.originalIndex = index;
    File.originalNumber = File.findNumberAt(sketch, index);
  };
  File.offsetOriginalNumber = function (sketch, offset) {
    File.spinNumberAt(sketch, File.originalIndex, 1, offset, File.originalNumber);
  };
  return File;
});

