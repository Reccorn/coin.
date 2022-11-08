/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';
import Chart from 'chart.js/auto';
import { bankApi } from './api.js';
import { Autofill } from './autofill.js'
import { Loader } from './loader.js';

const router = new Navigo('/');

let token = localStorage.getItem('token');
let notice;
let sortedAccounts = [];

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

function detailAccount(id) {
  const head = document.querySelector('.content__head');
  head.classList.add('__detail');
  head.querySelector('h2').innerText = 'Просмотр счёта';

  const backBtn = head.querySelector('.btn');
  backBtn.classList.remove('create__btn');
  backBtn.classList.add('back__btn');
  backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M3.83 5L7.41 1.41L6 0L0 6L6 12L7.41 10.59L3.83 7L16 7V5L3.83 5Z" fill="white"/></svg>Вернуться назад';

  const main = document.querySelector('.content__main');
  const list = main.querySelector('.accounts__list');
  if (list !== null) {
    list.remove();
  }

  backBtn.addEventListener('click', () => {
    if (backBtn.classList.contains('to__account')) {
      backBtn.classList.remove('to__account');
      main.innerHTML = '';
      detailAccount(id);
    } else {
      window.location.reload();
    }
  });

  let detailContent = el('.account__content');
  let create = new Account(id, detailContent);
  main.append(detailContent);
}

async function createCurrencies() {
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
        swapCurrencies(balance);
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

async function swapCurrencies(balance) {
  const balanceList = balance.querySelector('.currencies__list');
  let from = document.getElementById('swap-from').value;
  let to = document.getElementById('swap-to').value;
  let amount = document.getElementById('swap-amount').value;

  const result = await bankApi.exchangeCurrency(from, to, amount, token);

  if (result.payload !== null) {
    const newList = el('ul.currencies__list');
    await getCurrencyBalance(newList);
    balance.replaceChild(newList, balanceList);
    notice.show('Перевод прошёл успешно', 'success');
  } else {
    notice.show(result.error, 'error');
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

export function initMap() {
  ymaps.ready(async function() {
    let myMap = new ymaps.Map("map", {
      center: [55.76, 37.64],
      zoom: 11
    });

    const data = await bankApi.getBanks();

    if (data.payload !== null) {
      for (let obj in data.payload) {
        let object = data.payload[obj];

        myMap.geoObjects
          .add(new ymaps.Placemark([object.lat, object.lon], {
              balloonContent: 'Coin.'
          }, {
              preset: 'islands#icon',
              iconColor: '#0095b6'
          }));
      }
    } else {
      notice.show(data.error, 'error');
    }
  })
}

export default async function createContent(address) {
  const container = el('.container');
  notice = new Notice();

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

function createChart(ctx, data, dynamic) {
  let monthes = [];
  let balances = [];

  if (dynamic) {
    for (let i = 0; i < data.length; i++) {
      monthes.push(data[i].month);
      balances.push(data[i].balance);
    }

    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthes,
        datasets: [{
            label: 'Динамика баланса',
            data: balances,
            backgroundColor: [
              'rgba(17, 106, 204, 1)'
            ]
        }],

      },
      options: {
        scales: {
            y: {
                beginAtZero: false,
                position: 'right',
                ticks: {
                  font: {
                    size: 14,
                    // weight: 700,
                    color: 'black'
                  }
                }
            },
            x: {
              ticks: {
                font: {
                  size: 16,
                  // weight: 700,
                  color: 'black'
                }
              }
            }
        },
        plugins: {
          legend: {
            display: false
          },
          datasets: {
            font: {
              size: 20,
              weight: 700,
              color: '#000'
            },
            position: 'right'
          }
        }
      }
    });
  }
}

class Card {
  constructor(obj, sort) {
    this.obj = obj;
    this.sort = sort;
  }

  async createElement() {
    const parent = this.obj;
    const list = el('ul.accounts__list');

    try {
      const data = await bankApi.getAccounts(token);
      if (this.sort !== 'По номеру' && this.sort !== 'По балансу' && this.sort !== 'По последней транзакции') {
        sortedAccounts = data.payload;
      }

      if (data.payload !== null) {
        let array = sortedAccounts;

        if (this.sort === 'По номеру') {
          array.sort((a, b) => parseInt(a.account) - parseInt(b.account));
        } else if (this.sort === 'По балансу') {
          array.sort((a, b) => parseInt(a.balance) - parseInt(b.balance));
        } else if (this.sort === 'По последней транзакции') {
          array.sort(function(a, b) {
            let aDate;
            let bDate;
            let aTransactions = a.transactions;
            let bTransactions = b.transactions;

            if (aTransactions.length) {
              aDate = new Date(Date.parse(a.transactions[0].date));
            } else {
              aDate = new Date(2000, 0, 1);
            }

            if (bTransactions.length) {
              bDate = new Date(Date.parse(b.transactions[0].date));
            } else {
              bDate = new Date(2000, 0, 1);
            }

            return bDate - aDate;
          });
        }

        for (let i = 0; i < array.length; i++) {
          const card = el('li.accounts__item');
          const number = el('span.accounts__number');
          const balance = el('span.accounts__balance');
          const cardBottom = el('.accounts__item__bottom');
          const transaction = el('p.accounts__transaction');
          const openBtn = el('button.btn.accounts__btn', 'Открыть');

          let item = array[i];

          number.textContent = item.account;
          balance.textContent = item.balance + ' ₽';

          if (item.transactions.length) {
            let transactionDate = new Date(Date.parse(item.transactions[0].date));
            let day = transactionDate.getDate();
            let month = transactionDate.toLocaleString('ru-ru', { month: 'long' });
            if (month.endsWith('ь') || month.endsWith('й')){
              month = month.replace(/.$/, 'я')
            } else {
              month += 'а';
            }
            let year = transactionDate.getFullYear();

            transaction.innerHTML = `<b>Последняя транзакция:</b><br> ${day} ${month} ${year}`;
          }

          openBtn.addEventListener('click', () => {
            detailAccount(item.account);
          });

          setChildren(cardBottom, [ transaction, openBtn ]);
          setChildren(card, [ number, balance, cardBottom ]);

          list.append(card);
        }
      } else {
        throw data.error;
      }
    } catch (err) {
      notice.show(err, 'error');
    } finally {
      setChildren(parent, list);
    }
  }
}

class Account {
  constructor(id, obj) {
    this.id = id;
    this.content = obj;
    this.head = el('.account__head');
    this.items = el('.account__items');
    this.story = el('.account__story');
    this.upBtn;
    this.scrollPos;
    this.counter = 1;

    this.build();
  }

  async build() {
    let loader = new Loader();
    loader.build();

    this.upBtn = el('button.btn.account__up');
    this.upBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M3.83 5L7.41 1.41L6 0L0 6L6 12L7.41 10.59L3.83 7L16 7V5L3.83 5Z" fill="white"/></svg>Наверх';

    try {
      this.data = await this.getData();

      console.log(this.data.payload)

      if (this.data.payload !== null) {
        this.headContent(this.data.payload.balance);
        this.itemsContent(this.data.payload.balance, this.data.payload.transactions.reverse());
        this.storyContent(this.data.payload.transactions, 10);

        this.story.addEventListener('click', () => {
          this.showMore();
        });

        setChildren(this.content, [ this.head, this.items, this.story ]);
      } else {
        throw this.data.error;
      }
    } catch(err) {
      notice.show(err, 'error');
      console.log(err)
    } finally {
      loader.hide();

      document.body.append(this.upBtn);
    }
  }

  async getData() {
    let data = await bankApi.getAccount(this.id, token);
    return data;
  }

  headContent(balance) {
    this.number = el('.account__number');
    this.number.innerText = `№ ${this.id}`;

    this.balance = el('.account__balance');
    this.balance.innerHTML = `<span>Баланс</span>${balance} ₽`;

    this.head.append(this.number, this.balance);
  }

  itemsContent(balance, transactions) {
    this.transfer = el('.account__item');
    this.chart = el('.account__item.account__chart');

    this.transferTitle = el('.account__title', 'Новый перевод');
    this.chartTitle = el('.account__title', 'Динамика баланса');

    this.form = el('form.account__form.form');
    this.formItemFirst = el('.account__form_item');
    this.formItemSecond = el('.account__form_item');
    this.submitBtn = el('button.btn', {
      type: 'submit'
    });

    this.submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 20H4C2.89543 20 2 19.1046 2 18V5.913C2.04661 4.84255 2.92853 3.99899 4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20ZM4 7.868V18H20V7.868L12 13.2L4 7.868ZM4.8 6L12 10.8L19.2 6H4.8Z" fill="white"/></svg>Отправить';

    this.accountLabel = el('span', 'Номер счёта получателя');
    this.autofillBox = el('.autofill__box');
    let to = new Autofill(this.autofillBox);

    this.inputLabel = el('label', 'Сумма перевода');
    this.input = el('input', {
      type: 'number',
      id: 'transfer-amount',
      name: 'transfer-amount',
      placeholder: '0'
    });

    this.inputLabel.append(this.input);

    this.formItemFirst.append(this.accountLabel, this.autofillBox);
    this.formItemSecond.append(this.inputLabel);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      transferFunds(this.data.payload.account);
    });

    setChildren(this.form, [ this.formItemFirst, this.formItemSecond, this.submitBtn ]);
    setChildren(this.transfer, [ this.transferTitle, this.form ]);

    this.chartBody = el('.chart__body');
    this.chartCanvas = el('canvas.#chart-06');

    this.chartBody.append(this.chartCanvas);

    setChildren(this.chart, [ this.chartTitle, this.chartBody ]);

    let balances = getBalances(this.data.payload.account, balance, transactions, 6);

    createChart(this.chartCanvas, balances, true);

    this.chart.addEventListener('click', () => {
      this.showMore();
    });

    this.items.append(this.transfer, this.chart);
  }

  storyContent(transactions, type) {
    if (transactions.length) {
      let scrolling = false;
      if (transactions.length < type) {
        type = transactions.length;
      } else if (type === 'all') {
        type = 25;
        if (transactions.length > type) {
          scrolling = true;
        }
      }

      this.block = el('.account__item');
      this.storyTitle = el('.account__title', 'История переводов');
      this.storyHead = el('.account__story_head');
      this.storyList = el('.account__story_list');

      setChildren(this.storyHead, [
        el('.account__story_item', 'Счёт отправителя'),
        el('.account__story_item', 'Счёт получателя'),
        el('.account__story_item', 'Сумма'),
        el('.account__story_item', 'Дата')
      ]);

      createItems(this.storyList, this.data.payload.account, 0);

      if (scrolling) {
        window.addEventListener('scroll', () => {
          if (window.scrollY + window.innerHeight === document.body.scrollHeight) {
            let nextCounter = 25 * this.counter;
            type = type + 25;
            createItems(this.storyList, this.data.payload.account, nextCounter);
            this.counter++;
          }
        });
      }

      setChildren(this.block, [ this.storyTitle, this.storyHead, this.storyList ]);

      this.story.append(this.block);
      this.scrollPos = document.body.scrollHeight;
      this.scrollTop(scrolling);
    }

    function createItems(list, account, counter) {
      for (let i = counter; i < type; i++) {
        let item = el('.account__story_list_item');
        let date = new Date(transactions[i].date);
        let month = date.getMonth() + 1;
        let day = date.getDate()

        if (month < 10) {
          month = '0' + month;
        }
        if (day < 10) {
          day = '0' + day;
        }

        let amountItem = el('.account__story_item');
        let amount;

        if (transactions[i].to === account) {
          amount = '+ ' + transactions[i].amount + ' ₽';
          amountItem.classList.add('__pos');
        } else {
          amount = '- ' + transactions[i].amount + ' ₽';
          amountItem.classList.add('__neg');
        }

        amountItem.innerText = amount;

        setChildren(item, [
          el('.account__story_item', transactions[i].from),
          el('.account__story_item', transactions[i].to),
          amountItem,
          el('.account__story_item', `${day}.${month}.${date.getFullYear()}`)
        ]);

        list.append(item);
      }
    }
  }

  showMore() {
    let loader = new Loader();
    loader.build();
    document.querySelector('h2').innerText = 'История баланса';
    this.backBtn = document.querySelector('.back__btn');
    this.backBtn.classList.add('to__account');

    this.items.innerHTML = '';
    this.story.innerHTML = '';

    try {
      this.moreCharts(this.data.payload.balance, this.data.payload.transactions);
      this.storyContent(this.data.payload.transactions, 'all');
    } finally {
      loader.hide();
    }
  }

  moreCharts(balance, transactions) {
    this.items.classList.add('__charts');
    this.firstChart = el('.account__item');
    this.secondChart = el('.account__item');

    this.firstTitle = el('.account__title', 'Динамика баланса');
    this.secondTitle = el('.account__title', 'Соотношение входящих исходящих транзакций');

    this.firstChartBody = el('.chart__body');
    this.firstChartCanvas = el('canvas.#chart-12');

    this.firstChartBody.append(this.firstChartCanvas);

    setChildren(this.firstChart, [ this.firstTitle, this.firstChartBody ]);

    let balances = getBalances(this.data.payload.account, balance, transactions, 12);

    createChart(this.firstChartCanvas, balances, true);

    this.secondChartBody = el('.chart__body');
    this.secondChartCanvas = el('canvas.#chart-ratio');

    setChildren(this.secondChart, [ this.secondTitle, this.secondChartBody ]);

    // let ratio = getRatio()

    setChildren(this.items, [ this.firstChart, this.secondChart ]);
  }

  scrollTop(scrolling) {
    if (scrolling) {
      window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight >= this.scrollPos) {
          this.upBtn.classList.add('__show');

          this.upBtn.addEventListener('click', () => {
            window.scrollTo({top: 0, behavior: 'smooth'});
          });
        } else {
          this.upBtn.classList.remove('__show');
        }
      });
    }
  }
}

async function transferFunds(from) {
  try {
    let to = document.getElementById('transfer-to').value;
    let amount = document.getElementById('transfer-amount').value;

    let result = await bankApi.transferFunds(from, to, amount, token);

    if (result.payload !== null) {
      let savedAccounts = JSON.parse(localStorage.getItem('transferStory')) || [];

      savedAccounts.push(to);
      console.log(savedAccounts)
      localStorage.setItem('transferStory', JSON.stringify(savedAccounts));

      document.getElementById('transfer-to').value = '';
      document.getElementById('transfer-amount').value = '';
      notice.show('Перевод прошёл успешно', 'success');
    } else {
      throw result.error;
    }
  } catch(err) {
    notice.show(err, 'error');
  }
}

function getBalances(account, balance, transactions, type) {
  let balances = [];
  let currentBalance = balance;
  let currentMonth = '';

  if (transactions.length) {
    for (let i = 0; i < transactions.length; i++) {
      let date = new Date(Date.parse(transactions[i].date));
      let month = date.toLocaleString('default', { month: 'short' });

      if (transactions[i].to === account) {
        currentBalance = currentBalance + transactions[i].amount;
      } else {
        currentBalance = currentBalance - transactions[i].amount;
      }

      if (month !== currentMonth || i === transactions.length - 1) {
        let object = {
          balance: currentBalance,
          month: month
        };
        balances.push(object);

        if (balances.length < type && i === transactions.length - 1) {
          return balances.reverse();
        } else if (balances.length === type) {
          return balances.reverse();
        }

        currentMonth = month;
      }
    }
  } else {
    balances = [ 0, 0, 0, 0, 0, 0 ];
    return balances;
  }
}

class Select {
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

router.resolve();
