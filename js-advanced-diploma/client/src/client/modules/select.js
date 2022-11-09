/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';

export class Select {
  constructor(obj) {
    this.obj = obj;
    this.select = this.obj.querySelector('select');
    this.options = obj.querySelectorAll('option');

    this.build();
  }

  build() {
    this.head = el('.select__head');
    this.value = el('span.select__value');
    this.arrow = el('.select__arrow');
    this.list = el('.select__list');

    this.options.forEach((value) => {
      const option = el('.select__option');

      option.textContent = value.textContent;
      option.setAttribute('data-value', value.textContent);

      if (value.hidden || value.default) {
        this.value.textContent = value.textContent;
      } else {
        this.list.append(option);
      }

      option.addEventListener('click', () => {
        this.setValue(option);
      });
    });

    this.arrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="22" viewBox="0 0 25 22" fill="none"><path d="M7.9519 8.5L12.9519 13.5L17.9519 8.5L7.9519 8.5Z" fill="#182233"/></svg>';
    this.head.append(this.value, this.arrow);

    this.obj.append(this.head, this.list);

    this.setListeners();
  }

  setListeners() {
    document.addEventListener('click', (e) => {
      if (e.target !== this.head) {
        this.hide();
      } else {
        this.toggle();
      }
    });
  }

  toggle() {
    if (this.obj.classList.contains('__active')) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.obj.classList.add('__active');
  }

  hide() {
    this.obj.classList.remove('__active');
  }

  setValue(option) {
    document.querySelectorAll('.select__option').forEach((item) => {
      item.classList.remove('__active');
    });

    let val = option.getAttribute('data-value');

    this.value.textContent = val;
    this.select.value = val;
    option.classList.add('__active');
    this.hide();
  }
}
