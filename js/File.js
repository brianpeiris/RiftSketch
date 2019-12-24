import { Math } from "three";

export default class File {
  constructor(name, contents, uuid) {
    this.uuid = uuid || Math.generateUUID();
    this.name = name || "Example";
    this.contents = contents;
  }
  _findNumberAt(index) {
    const match = this.contents.substring(index).match(/-?\d+\.?\d*/);
    if (match) {
      return match[0];
    }
  }
  _spinNumber(number, direction, amount) {
    if (number.indexOf(".") === -1) {
      return (parseInt(number, 10) + direction * amount).toString();
    } else {
      return (parseFloat(number) + direction * amount).toFixed(2);
    }
  }
  spinNumberAt(index, direction, amount) {
    const number = this._findNumberAt(index);
    if (number === undefined) {
      return;
    }
    const newNumber = this._spinNumber(number, direction, amount);
    this.contents = this.contents.substring(0, index) + newNumber + this.contents.substring(index + number.length);
  }
}
