/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import { Loader } from './loader.js';
import { bankApi } from './api.js';
import { Autofill } from './autofill.js';
import { getNotice } from './notice.js';
import { createChart } from './charts.js';

let token = localStorage.getItem('token');

async function transferFunds(from, notice) {
  try {
    let to = document.getElementById('transfer-to').value;
    let amount = document.getElementById('transfer-amount').value;

    if (to.length > 0 && amount.length > 0) {
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
    } else {
      throw 'Введите все данные';
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
    let length = getLength(transactions, type);
    // let monthes = getMonthes(length);
    // console.log(monthes);

    // let index = 0;

    // for (let i = 0; i < transactions.length; i++) {
    //   let currentMonth = monthes[index];
    //   let date = getDate(transactions[i].date);
    //   let month = getMonth(date);

    //   if (month === currentMonth) {
    //     createObject(currentBalance, currentMonth);
    //     next = true;
    //     index++;
    //     if (transactions[i].to === account) {
    //       currentBalance = currentBalance - transactions[i].amount;
    //     } else {
    //       currentBalance = currentBalance + transactions[i].amount;
    //     }
    //   } else {
    //     if (next) {
    //       createObject(currentBalance, currentMonth);
    //     }
    //   }
    // }

    for (let i = 0; i < transactions.length; i++) {
      let date = getDate(transactions[i].date);
      let month = getMonth(date);

      if (month !== currentMonth) {
        let object = {
          balance: currentBalance,
          month: month
        };
        balances.push(object);

        if (balances.length === length) {
          return balances.reverse();
        }

        currentMonth = month;
      }

      if (transactions[i].to === account) {
        currentBalance = currentBalance + transactions[i].amount;
      } else {
        currentBalance = currentBalance - transactions[i].amount;
      }
    }
  } else {
    balances = [ 0, 0, 0, 0, 0, 0 ];
    return balances;
  }

  // function createObject(balance, month) {
  //   let object = {
  //     balance: balance,
  //     month: month
  //   };
  //   balances.push(object);

  //   if (balances.length === length) {
  //     console.log(balances);
  //     return balances.reverse();
  //   }
  // }
}

function getRatio(account, transactions) {
  let ratio = [];
  let currentMonth = new Date().toLocaleString('default', { month: 'short' });
  let type = 12;
  let income = 0;
  let outcome = 0;

  if (transactions.length) {
    let length = getLength(transactions, type);

    for (let i = 0; i < transactions.length; i++) {
      let date = getDate(transactions[i].date);
      let month;

      if (i === 0) {
        month = currentMonth;
      } else {
        month = getMonth(date);
      }

      if (month !== currentMonth || i === transactions.length - 1) {
        let object = {
          income: income,
          outcome: outcome,
          month: currentMonth
        };

        ratio.push(object);

        if (ratio.length === length) {
          return ratio.reverse();
        }

        currentMonth = month;
      }

      if (transactions[i].to === account) {
        income = income + transactions[i].amount;
      } else {
        outcome = outcome + transactions[i].amount;
      }
    }
  } else {
    ratio = [ 0, 0, 0, 0, 0, 0 ];
    return ratio;
  }
}

function getDate(date) {
  return new Date(Date.parse(date));
}

function getMonth(date) {
  return date.toLocaleString('default', { month: 'short' });
}

// function getMonthes(length) {
//   let monthes = [];
//   let currentMonth = new Date().getMonth()

//   for (let i = 0; i < length; i++) {
//     let monthName = getMonthName(currentMonth);
//     monthes.push(monthName);

//     currentMonth--;
//   }

//   function getMonthName(number) {
//     const date = new Date();
//     date.setMonth(number);

//     return date.toLocaleString('default', { month: 'short' });
//   }

//   return monthes;
// }

function getLength(transactions, length) {
  let sum = 0;
  let monthCounted = '';

  for (let i = 0; i < transactions.length; i++) {
    let date = getDate(transactions[i].date);
    let month = getMonth(date);

    if (monthCounted !== month) {
      sum++;
    }

    monthCounted = month;
  }

  if (sum < length) {
    length = sum;
  }

  return length;
}

export class Account {
  constructor(id, obj) {
    this.id = id;
    this.content = obj;
    this.head = el('.account__head');
    this.items = el('.account__items');
    this.story = el('.account__story');
    this.upBtn;
    this.scrollPos;
    this.counter = 1;
    this.notice = getNotice();

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
      this.notice.show(err, 'error');
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
      transferFunds(this.data.payload.account, this.notice);
    });

    setChildren(this.form, [ this.formItemFirst, this.formItemSecond, this.submitBtn ]);
    setChildren(this.transfer, [ this.transferTitle, this.form ]);

    if (transactions.length) {
      this.chartBody = el('.chart__body');
      this.chartCanvas = el('canvas.#chart-06');
      this.min = el('.chart__min');
      this.max = el('.chart__max');
      this.monthes = el('.chart__monthes');

      this.chartBody.append(this.chartCanvas);

      setChildren(this.chart, [ this.chartTitle, this.chartBody, this.min, this.max, this.monthes ]);

      let balances = getBalances(this.data.payload.account, balance, transactions, 6);

      createChart(this.chartCanvas, balances, true);

      this.chart.addEventListener('click', () => {
        this.showMore();
      });
    } else {
      this.chart = '';
    }

    this.items.append(this.transfer, this.chart);
  }

  storyContent(transactions, type) {
    if (transactions.length) {
      let scrolling = false;

      if (type === 'all') {
        type = 25;
        if (transactions.length > type) {
          scrolling = true;
        } else if (transactions.length < type) {
          type = transactions.length;
        }
      } else if (transactions.length < type) {
        type = transactions.length;
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

      createItems(transactions, this.storyList, this.data.payload.account, 0);

      if (scrolling) {
        window.addEventListener('scroll', () => {
          if (window.scrollY + window.innerHeight === document.body.scrollHeight) {
            let nextCounter = 25 * this.counter;
            type = type + 25;
            createItems(this.data.payload.transactions, this.storyList, this.data.payload.account, nextCounter);
            this.counter++;
          }
        });
      }

      setChildren(this.block, [ this.storyTitle, this.storyHead, this.storyList ]);

      this.story.append(this.block);
      this.scrollPos = document.body.scrollHeight;
      this.scrollTop(scrolling);
    }

    function createItems(transactions, list, account, counter) {
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
    this.firstMin = el('.chart__min');
    this.firstMax = el('.chart__max');
    this.firstMonthes = el('.chart__monthes');

    this.firstChartBody.append(this.firstChartCanvas);

    setChildren(this.firstChart, [ this.firstTitle, this.firstChartBody, this.firstMin, this.firstMax, this.firstMonthes ]);

    let balances = getBalances(this.data.payload.account, balance, transactions, 12);

    createChart(this.firstChartCanvas, balances, true);

    this.secondChartBody = el('.chart__body');
    this.secondChartCanvas = el('canvas.#chart-ratio');
    this.secondMin = el('.chart__min.__second_min');
    this.secondMax = el('.chart__max.__second_max');
    this.secondMiddle = el('.chart__middle');
    this.secondMonthes = el('.chart__monthes.__second_monthes');

    this.secondChartBody.append(this.secondChartCanvas);

    setChildren(this.secondChart, [ this.secondTitle, this.secondChartBody, this.secondMin, this.secondMax, this.secondMiddle, this.secondMonthes ]);

    let ratio = getRatio(this.data.payload.account, transactions);

    createChart(this.secondChartCanvas, ratio, false);

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
