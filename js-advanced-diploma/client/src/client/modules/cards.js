/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';
import { bankApi } from './api.js';
import { Account } from './account.js';
import { getNotice } from './notice.js';

const router = new Navigo('/');

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

export function detailAccount(id) {
  window.location.href = '/accounts/' + id;
}

router.resolve();
