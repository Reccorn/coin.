/* eslint-disable no-undef, no-unused-vars */
import { el, setChildren } from 'redom';
import Navigo from 'navigo';
import createHeader from './modules/header.js';
import { Loader } from './modules/loader.js';
import createContent from './modules/content.js';
import { initMap } from './modules/map.js'
import './css/styles.scss';

const router = new Navigo('/');

async function createApp(address) {
  setChildren(document.body, []);

  let loader = new Loader();
  loader.build();

  const main = el('main.main');
  let empty = false;

  if (address === 'entry') empty = true;

  let content;

  try {
    document.body.append(createHeader(empty));
    content = await createContent(address);
  } catch(err) {
    console.log(err);
  } finally {
    setChildren(main, content);

    loader.hide();

    document.body.append(main);
  }
}

router.on('/', () => {
  let check = localStorage.getItem('authorized') || 'false';

  if (check === 'true') {
    router.navigate('/accounts');
  } else {
    createApp('entry');
  }
});

router.on('/accounts/*', () => {
  const path = window.location.pathname.split("/").pop();
  createApp(path);
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
