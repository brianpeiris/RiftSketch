import { Math } from "three";

import File from "./File";

export default class Sketch {
  constructor(name, files, uuid) {
    this.uuid = uuid || Math.generateUUID();
    this.name = name || "Example Sketch";
    this.files = files || [new File()];
    this.initialized = false;
    this.state = {};
  }
  getCode() {
    let code = "";
    for (let i = 0; i < this.files.length; i++) {
      code += this.files[i].contents;
    }
    return code;
  }
  initialState(obj) {
    if (this.initialized) return;
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      this.state[key] = obj[key];
    }
  }
  toJSON() {
    return {
      uuid: this.uuid,
      name: this.name,
      files: this.files
    };
  }
  static fromJSON(obj) {
    return new Sketch(
      obj.name,
      obj.files.map(file => new File(file.name, file.contents, file.uuid)),
      obj.uuid
    );
  }
}
