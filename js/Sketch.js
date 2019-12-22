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
}
