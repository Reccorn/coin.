/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';

export class Autofill {
  constructor(obj) {
    this.box = obj;

    document.addEventListener('click', (e) => {
      if (e.target !== this.box) {
        this.hide();
      }
    });
    this.shown = false;

    this.build();
  }

  build() {
    this.input = el('input', {
      id: 'transfer-to',
      name: 'transfer-to',
      placeholder: 'Введите номер счёта'
    });
    this.list = el('.autofill__list');
    this.accounts = JSON.parse(localStorage.getItem('transferStory')) || [];

    this.input.addEventListener('input', () => {
      if (this.accounts.length) {
        this.show();
      }
    });

    setChildren(this.box, [ this.input, this.list ]);
  }

  show() {
    if (!this.shown) {
      this.list.innerHTML = '';
      if (this.accounts.length && this.accounts !== null) {
        for (let i = 0; i < this.accounts.length; i++) {
          let item = el('.autofill__item', this.accounts[i]);

          item.addEventListener('click', () => {
            this.setValue(item.innerText);
          });

          this.list.append(item);
        }
      }

      this.box.classList.add('__active');
      this.shown = true;
    }
  }

  hide() {
    this.box.classList.remove('__active');
    this.shown = false;
  }

  setValue(value) {
    this.hide();
    this.input.value = value;
  }
}
