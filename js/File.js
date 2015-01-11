define([
],
function (
) {
  var constr = function (name, contents) {
    this.name = name || 'Example';
    var defaultContents = ('\
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
    '.replace(/\n {8}/g, '\n').replace(/^\s+|\s+$/g, ''));
    this.contents = contents === undefined ? defaultContents : contents;
    this.selected = true;
  };
  constr.prototype.findNumberAt = function (index) {
    return this.contents.substring(index).match(/-?\d+\.?\d*/)[0];
  };
  constr.prototype.spinNumber = function (number, direction, amount) {
    if (number.indexOf('.') === -1) {
      return (parseInt(number, 10) + direction * amount).toString();
    }
    else {
      return (parseFloat(number) + direction * amount).toFixed(2);
    }
  };
  constr.prototype.spinNumberAt = function (
    index, direction, amount, originalNumber
  ) {
    var number = this.findNumberAt(index);
    originalNumber = originalNumber || number;
    var newNumber = this.spinNumber(originalNumber, direction, amount);
    this.contents = (
      this.contents.substring(0, index) +
      newNumber +
      this.contents.substring(index + number.length)
    );
  };
  constr.prototype.recordOriginalNumberAt = function (index) {
    this.originalIndex = index;
    this.originalNumber = this.findNumberAt(index);
  };
  constr.prototype.offsetOriginalNumber = function (offset) {
    this.spinNumberAt(this.originalIndex, 1, offset, this.originalNumber);
  };
  return constr;
});

