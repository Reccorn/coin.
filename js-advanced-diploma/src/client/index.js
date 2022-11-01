/* eslint-disable no-undef, no-unused-vars */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';
import createHeader from './header.js';
import createContent, { initMap } from './content.js';
import './styles.scss';

const router = new Navigo('/');

async function createApp(address) {
  setChildren(document.body, []);

  const main = el('main.main');
  let empty = false;

  if (address === 'entry') empty = true;

  const content = await createContent(address);
  setChildren(main, content);

  setChildren(document.body, [
    createHeader(empty),
    main
  ]);
}

router.on('/', () => {
  localStorage.removeItem('token');
  createApp('entry');
});

router.on('/accounts', () => {
  createApp('accounts');
});

router.on('/currency', () => {
  createApp('currency');
});

router.on('/atm', () => {
  createApp('atm');
  let timer = setTimeout(() =>
    initMap(),
  350);
});

router.resolve();
