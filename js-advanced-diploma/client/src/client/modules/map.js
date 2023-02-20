/* eslint-disable no-unused-vars, no-undef */
import { bankApi } from './api.js';
import { getNotice } from './notice.js';

export function initMap() {
  let notice = getNotice();

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
