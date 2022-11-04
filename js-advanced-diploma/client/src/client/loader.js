/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';

export class Loader {
  constructor() {
    this.outer = el('.loader');
    this.block = el('.loader__block');
  }

  build() {
    this.parent = document.querySelector('body');
    this.outer.append(this.block);
    this.parent.append(this.outer);
  }

  hide() {
    this.outer.remove();
  }
}
