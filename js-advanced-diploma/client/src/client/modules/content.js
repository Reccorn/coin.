/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';
import { getNotice } from './notice.js'
import { bankApi } from './api.js';
import { Card, detailAccount } from './cards.js';
import { Account } from './account.js';
import { createCurrencies } from './currencies.js';
import { Select } from './select.js';

const router = new Navigo('/');

let notice;

function createForm() {
  const formContent = el('.form__content');
  const form = el('form.form');

  function createFormItem(type) {
    const item = el('.form__item', type);

    setChildren(item, [
      el('label', type === 'login' ? 'Логин' : 'Пароль', {
        for: type
      }),
      el('input.form__input', {
        type: type === 'login' ? 'text' : 'password',
        id: type,
        placeholder: 'Placeholder'
      })
    ]);

    return item;
  }

  setChildren(form, [
    createFormItem('login'),
    createFormItem('password'),
    el('button.btn.disabled', 'Войти', {
      type: 'submit'
    })
  ]);

  setChildren(formContent, [
    el('h2', 'Вход в аккаунт'),
    form
  ]);

  form.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', checkInputs);
      input.addEventListener('blur', checkInputs);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');

    const result = await bankApi.authorization(loginInput.value, passwordInput.value);

    if (result.payload !== null) {
      localStorage.setItem('token', result.payload.token);
      localStorage.setItem('authorized', 'true');
      window.location = '/accounts';
    } else {
      notice.show(result.error, 'error');
    }
  });

  return formContent;
}

function checkInputs() {
  const inputs = document.querySelectorAll('input');
  let filledInputs = [];
  const btn = document.querySelector('.btn');

  inputs.forEach((input) => {
    if (input.value.length >= 6) {
      filledInputs.push(input);
    }

    if (filledInputs.length === 2) {
      console.log('filled')
      btn.classList.remove('disabled');
    } else {
      console.log('not filled')
      btn.classList.add('disabled');
    }
  });
}

function createContentHead(address) {
  const head = el('.content__head');

  const title = el('h2');
  let selectBox = '';
  let sort = '';
  let btn = '';

  if (address === 'accounts') {
    title.textContent = 'Ваши счета';
    selectBox = el('.select__box.select__box__head');

    const select = el('select.select',);
    setChildren(select, [
      el('option', 'Сортировка', {
        default: true,
        hidden: true,
      }),
      el('option', 'По номеру', {
        value: 'По номеру'
      }),
      el('option', 'По балансу', {
        value: 'По балансу'
      }),
      el('option', 'По последней транзакции', {
        value: 'По последней транзакции'
      })
    ]);

    setChildren(selectBox, select);
    sort = new Select(selectBox);

    let options = selectBox.querySelectorAll('.select__option');

    options.forEach((option) => {
      option.addEventListener('click', () => {
        const main = document.querySelector('.content__main');
        main.innerHTML = '';

        const sortedList = new Card(main, option.innerText);
        sortedList.createElement();
      });
    });

    btn = el('button.btn.create__btn');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4.00001L12 12M12 12L12 20M12 12L20 12M12 12L4 12" stroke="white" stroke-width="2"/></svg>Создать новый счёт';

    btn.addEventListener('click', () => {
      if (btn.classList.contains('create__btn')) {
        createAccount();
      }
    });
  } else if (address === 'currency') {
    title.textContent = 'Валютный обмен';
  } else if (address === 'atm') {
    title.textContent = 'Карта банкоматов';
  } else {
    head.classList.add('__detail');
    title.textContent = 'Просмотр счёта';
    btn = el('button.btn.back__btn');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M3.83 5L7.41 1.41L6 0L0 6L6 12L7.41 10.59L3.83 7L16 7V5L3.83 5Z" fill="white"/></svg>Вернуться назад';

    btn.addEventListener('click', () => {
      if (btn.classList.contains('to__account')) {
          btn.classList.remove('to__account');
          document.querySelector('.content__main').innerHTML = '';
          detailAccount(address);
        } else {
          window.location.href = '/accounts';
        }
    });
  }

  setChildren(head, [title, selectBox, btn]);

  return head;
}

async function createContentMain(address) {
  const main = el('.content__main');

  if (address === 'accounts') {
    const list = new Card(main, 'default');
    list.createElement();

    if (localStorage.getItem('newAccount')) {
      notice.show('Новый счёт создан успешно', 'success');
      localStorage.removeItem('newAccount');
    }
  } else if (address === 'atm') {
    const map = createMap();
    setChildren(main, map);
  } else if (address === 'currency') {
    const currencies = await createCurrencies();
    setChildren(main, currencies);
  } else {
    const openAccount = new Account(address, main);
    setChildren(main, openAccount);
  }

  return main;
}

async function createAccount() {
  try {
    const newAccount = await bankApi.createAccount(token);

    if (newAccount.payload !== null) {
      localStorage.setItem('newAccount', true);
    } else {
      throw newAccount.error;
    }
  } catch(err) {
    notice.show(err, 'error');
  } finally {
    window.location.reload();
  }
}

function createMap() {
  const script = el('script', {
    src: 'https://api-maps.yandex.ru/2.1/?apikey=ваш API-ключ&lang=ru_RU',
    type: 'text/javascript'
  });

  document.querySelector('head').append(script);

  const map = el('#map');

  return map;
}

export default async function createContent(address) {
  const container = el('.container');
  notice = getNotice();

  if (address === 'entry') {
    const form = createForm();

    setChildren(container, form);
    checkInputs();
  } else {
    const head = createContentHead(address);
    const main = await createContentMain(address);

    setChildren(container, [ head, main ]);
  }

  return container;
}

router.resolve();
