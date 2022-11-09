/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import { bankApi } from './api.js';
import { Account } from './account.js';
import { getNotice } from './notice.js';

let token = localStorage.getItem('token');
let sortedAccounts = [];

export class Card {
  constructor(obj, sort) {
    this.obj = obj;
    this.sort = sort;
    this.notice = getNotice();
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
      this.notice.show(err, 'error');
    } finally {
      setChildren(parent, list);
    }
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
