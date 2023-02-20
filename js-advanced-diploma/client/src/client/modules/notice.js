/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';

export function getNotice() {
  let notice = new Notice();
  return notice;
}


class Notice {
  constructor() {
    this.parent = document.querySelector('body');
    this.block = el('.notice');
    this.timeout;

    this.build();
  }

  build() {
    this.name = el('span.notice__name');
    this.close = el('.notice__close');

    setChildren(this.close, [
      el('span'),
      el('span')
    ]);

    this.close.addEventListener('click', () => {
      this.hide();
    });

    setChildren(this.block, [ this.name, this.close ]);
    this.parent.append(this.block);
  }

  show(text, type) {
    this.block.classList.remove('__error', '__success');

    if (type === 'error') {
      this.block.classList.add('__error');
    } else if (type === 'success') {
      this.block.classList.add('__success');
    }

    this.name.innerText = text;

    this.block.classList.add('__active');

    this.timeout = setTimeout(() => {
      this.hide()
    }, 10000);
  }

  hide() {
    clearTimeout(this.timeout);
    this.block.classList.remove('__active');
  }
}
