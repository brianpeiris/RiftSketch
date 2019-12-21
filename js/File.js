export default class File {
  constructor(name, contents) {
    this.name = name || "Example";
    this.contents = contents;
    this.selected = true;
  }
  findNumberAt(index) {
    const match = this.contents.substring(index).match(/-?\d+\.?\d*/);
    if (match) {
      return match[0];
    }
  }
  spinNumber(number, direction, amount) {
    if (number.indexOf(".") === -1) {
      return (parseInt(number, 10) + direction * amount).toString();
    } else {
      return (parseFloat(number) + direction * amount).toFixed(2);
    }
  }
  spinNumberAt(index, direction, amount, originalNumber) {
    const number = this.findNumberAt(index);
    if (number === undefined) {
      return;
    }
    originalNumber = originalNumber || number;
    const newNumber = this.spinNumber(originalNumber, direction, amount);
    this.contents = this.contents.substring(0, index) + newNumber + this.contents.substring(index + number.length);
  }
  recordOriginalNumberAt(index) {
    const number = this.findNumberAt(index);
    if (number === undefined) {
      return;
    }
    this.originalNumber = number;
    this.originalIndex = index;
  }
  offsetOriginalNumber(offset) {
    this.spinNumberAt(this.originalIndex, 1, offset, this.originalNumber);
  }
}
