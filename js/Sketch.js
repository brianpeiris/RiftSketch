define([
  'js/File'
],
function (
  File
) {
  var constr = function (name, files) {
    this.name = name || 'Example Sketch';
    this.files = files || [
      new File()
    ];
  };
  constr.prototype.getCode = function () {
    var code = '';
    for (var i = 0; i < this.files.length; i++) {
      code += this.files[i].contents;
    }
    return code;
  };
  constr.prototype.addFile = function () {
    this.files.push(new File('Untitled', ''));
  };
  constr.prototype.set = function (sketch) {
    sketch.files.forEach(function (file, i) {
      this.files[i].contents = file.contents;
    }.bind(this));
  };
  return constr;
});
