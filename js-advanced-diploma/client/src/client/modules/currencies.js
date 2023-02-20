/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import { bankApi } from './api.js';
import { Select } from './select.js';
import { getNotice } from './notice.js';

let token = localStorage.getItem('token');

export async function createCurrencies() {
  let notice = getNotice();

  const parent = el('.currencies__content');
  const left = el('.currencies__left');
  const right = el('.currencies__right');

  const balance = el('.currencies__item');
  const swap = el('.currencies__item.currencies__item__swap');
  const course = el('.currencies__item.currencies__item__course');

  const balanceTitle = el('.currencies__title', 'Ваши валюты');
  const balanceList = el('ul.currencies__list');

  const courseTitle = el('.currencies__title', 'Изменение курсов в реальном времени');
  const courseList = el('ul.currencies__list');

  const swapTitle = el('.currencies__title', 'Обмен валют');
  const swapForm = el('form.currencies__form.form');
  const swapLeft = el('.currencies__form__left');
  const swapBtn = el('button.btn', 'Обменять', {
    type: 'submit'
  });
  const fromLabel = el('span', 'Из');
  const toLabel = el('span', 'в');
  const amountLabel = el('label', 'Сумма');
  const fromSelectBox = el('.select__box');
  const toSelectBox = el('.select__box');
  const amountInput = el('input.form__input', {
    name: 'swap-amount',
    id: 'swap-amount',
    type: 'number',
    placeholder: '0'
  });
  const fromSelect = el('select.select', {
    name: 'swap-from',
    id: 'swap-from',
  });
  const toSelect = el('select.select', {
    name: 'swap-to',
    id: 'swap-to',
  });
  let from ='';
  let to = '';

  try {
    const allCurrencies = await bankApi.getKnownCurrencies();

    if (allCurrencies.payload !== null) {
      for (let i = 0; i < allCurrencies.payload.length; i++) {
        const option = el('option', allCurrencies.payload[i], {
          value: allCurrencies.payload[i]
        });

        fromSelect.append(option);
        toSelect.append(option.cloneNode(true));
      }

      const defaultOption = el('option', 'BTC', {
        default: true,
        hidden: true
      });

      fromSelect.prepend(defaultOption);
      toSelect.prepend(defaultOption.cloneNode(true));

      fromSelectBox.append(fromSelect);
      toSelectBox.append(toSelect);

      from = new Select(fromSelectBox);
      to = new Select(toSelectBox);

      fromSelect.value = 'BTC';
      toSelect.value = 'BTC';

      amountLabel.append(amountInput);

      swapForm.addEventListener('submit', (e) => {
        e.preventDefault();
        swapCurrencies(balance, notice);
      });

      setChildren(swapLeft, [ fromLabel, fromSelectBox , toLabel, toSelectBox , amountLabel ]);
      setChildren(swapForm, [ swapLeft, swapBtn ]);
      setChildren(swap, [ swapTitle, swapForm ]);

      try {
        await getCurrencyBalance(balanceList);
        await getCurrencyChanges(courseList);
      } catch(err) {
        notice.show(err, 'error');
      }

      return parent;
    } else {
      throw allCurrencies.error;
    }
  } catch(err) {
    notice.show(err, 'error');
  } finally {
    setChildren(balance, [ balanceTitle, balanceList ]);
    setChildren(course, [ courseTitle, courseList ]);

    setChildren(left, [ balance , swap ]);
    setChildren(right, course);
    setChildren(parent, [ left, right ]);
  }
}

async function getCurrencyBalance(balanceList) {
  balanceList.innerHTML = '';
  const balanceData = await bankApi.getCurrencyAccounts(token);

  if (balanceData.payload !== null) {
    for (let obj in balanceData.payload) {
      let object = balanceData.payload[obj];

      const item = el('li.currencies__list__item');
      const code = el('.currencies__list__code', `${object.code}`);
      const space = el('.currencies__list__space');
      const amount = el('.currencies__list__amount', `${object.amount}`);

      setChildren(item, [ code, space, amount ]);
      balanceList.append(item);
    }

    return balanceList;
  } else {
    throw balanceData.error;
  }
}

async function getCurrencyChanges(courseList) {
  const courseData = await bankApi.getChangedCurrency();
  courseData.onmessage = (event) => {
    let info = JSON.parse(event.data);

    const item = el('li.currencies__list__item');
    const type = el('.currencies__list__code', `${info.from}/${info.to}`);
    const space = el('.currencies__list__space');
    const rate = el('.currencies__list__amount', `${info.rate}`);
    const arrow = el('.currencies__list__arrow');

    arrow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10" viewBox="0 0 20 10" fill="none"><path d="M20 10L10 0L0 10L20 10Z" fill="#76CA66"/></svg>';

    if (info.change >= 0) {
      item.classList.add('__up');
    } else {
      item.classList.add('__down');
    }

    setChildren(item, [ type, space, rate, arrow ]);

    const items = courseList.querySelectorAll('.currencies__list__item');

    if (items.length === 12) {
      items[11].remove();
    }

    courseList.prepend(item);
  }

  return courseList;
}

async function swapCurrencies(balance, notice) {
  const balanceList = balance.querySelector('.currencies__list');
  let from = document.getElementById('swap-from').value;
  let to = document.getElementById('swap-to').value;
  let amount = document.getElementById('swap-amount').value;

  if (to.length > 0 && from.length  > 0 && amount.length > 0) {
    const result = await bankApi.exchangeCurrency(from, to, amount, token);

    if (result.payload !== null) {
      const newList = el('ul.currencies__list');
      await getCurrencyBalance(newList);
      balance.replaceChild(newList, balanceList);
      notice.show('Перевод прошёл успешно', 'success');
    } else {
      notice.show(result.error, 'error');
    }
  } else {
    notice.show('Введите все данные', 'error');
  }
}
