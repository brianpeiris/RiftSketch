import File from "./File";
export default class Sketch {
  constructor(name, files) {
    this.name = name || "Example Sketch";
    this.files = files || [new File()];
  }
  getCode() {
    let code = "";
    for (let i = 0; i < this.files.length; i++) {
      code += this.files[i].contents;
    }
    return code;
  }
  addFile() {
    this.files.push(new File("Untitled", ""));
  }
  set(sketch) {
    sketch.files.forEach(
      function(file, i) {
        this.files[i].contents = file.contents;
      }.bind(this)
    );
  }
}
