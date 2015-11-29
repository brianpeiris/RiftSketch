define([
],
function (
) {
  var File = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents;
    this.selected = true;
  };
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

