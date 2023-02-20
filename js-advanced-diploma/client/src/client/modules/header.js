/* eslint-disable no-undef */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';

const router = new Navigo('/');

function createNavLink(href, name) {
  const navItem = el('li.header__nav-item');
  const link = el('a.btn.btn__white.header__nav-link', name, {
    'href': href
  });

  if (name === 'Выйти') {
    link.classList.add('exit__btn');

    link.addEventListener('click', () => {
      localStorage.setItem('authorized', 'false');
      localStorage.removeItem('token');
    });
  }

  if (window.location.pathname.split('/').pop() === href.replace('/', '')) {
    link.classList.add('__active');
  }

  setChildren(navItem, link);
  return navItem;
}

export default function createHeader(empty) {
  const header = el('header.header');
  const container = el('.container');
  const content = el('.header__content');

  setChildren(content, el('h1.header__logo', 'Coin.'));

  if (!empty) {
    const nav = el('nav.header__nav');
    const navList = el('ul.header__nav-list');

    setChildren(navList, [
      createNavLink('/atm', 'Банкоматы'),
      createNavLink('/accounts', 'Счета'),
      createNavLink('/currency', 'Валюта'),
      createNavLink('/', 'Выйти')
    ]);

    document.querySelectorAll('.header__nav-link').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        router.navigate(event.target.getAttribute('href'));
      });
    });

    setChildren(nav, navList);
    content.appendChild(nav);
  }

  setChildren(container, content);
  setChildren(header, container);

  return header;
}

router.resolve();
