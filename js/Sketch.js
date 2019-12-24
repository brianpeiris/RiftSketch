import { Math } from "three";

import File from "./File";

export default class Sketch {
  constructor(name, files, uuid) {
    this.uuid = uuid || Math.generateUUID();
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
  static fromJSON(obj) {
    return new Sketch(
      obj.name,
      obj.files.map(file => new File(file.name, file.contents, file.uuid)),
      obj.uuid
    );
  }
}
