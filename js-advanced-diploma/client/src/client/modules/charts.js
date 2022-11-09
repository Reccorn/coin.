/* eslint-disable no-unused-vars, no-undef */
import { el, setChildren } from 'redom';
import Chart from 'chart.js/auto';

export function createChart(ctx, data, dynamic) {
  let monthes = [];
  let balances = [];
  let income = [];
  let outcome = [];
  let middle = 0;

  if (dynamic) {
    for (let i = 0; i < data.length; i++) {
      monthes.push(data[i].month);
      balances.push(Math.floor(data[i].balance));
    }

    let min = Math.min.apply(null, balances);
    let max = Math.max.apply(null, balances);

    if (min === max) {
      min = 0;
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
        barThickness: 50,
        chartAreaBorder: {
          borderColor: 'black',
          borderWidth: 1,
        },
        scales: {
            y: {
                display: false,
                beginAtZero: true,
                position: 'right',
                ticks: {
                  font: {
                    size: 14,
                    // weight: 700,
                    color: 'black'
                  }
                },
                grid: {
                  display: false
                }
            },
            x: {
              display: false,
              ticks: {
                font: {
                  size: 16,
                  // weight: 700,
                  color: 'black'
                }
              },
              grid: {
                display: false
              }
            }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
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

    let timeout = setTimeout(() => {
      createLabels(min, max, 0, monthes, dynamic);
    }, 100);
  } else {
    for (let i = 0; i < data.length; i++) {
      monthes.push(data[i].month);
      income.push(Math.floor(data[i].income));
      outcome.push(Math.floor(data[i].outcome));
    }

    let inMax = Math.max.apply(null, income);
    let outMax = Math.max.apply(null, outcome);

    if (inMax >= outMax) {
      middle = outMax;
    } else {
      middle = inMax;
    }

    const secondChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthes,
        datasets: [
          {
            label: 'Исходящие',
            data: outcome,
            backgroundColor: [
              'rgba(253, 78, 93, 1)'
            ]
          },
          {
            label: 'Входящие',
            data: income,
            backgroundColor: [
              'rgba(118, 202, 102, 1)'
            ]
          },
        ],
      },
      options: {
        chartAreaBorder: {
          borderColor: 'black',
          borderWidth: 1,
        },
        barThickness: 50,
        scales: {
            y: {
              display: false,
              // beginAtZero: true,
              position: 'right',
              ticks: {
                beginAtZero: true,
                font: {
                  size: 14,
                  // weight: 700,
                  color: 'black'
                }
              },
              stacked: true,
              grid: {
                display: false
              }
            },
            x: {
              display: false,
              ticks: {
                beginAtZero: true,
                font: {
                  size: 16,
                  // weight: 700,
                  color: 'black'
                }
              },
              stacked: true,
              grid: {
                display: false
              }
            }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
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

    let timeout = setTimeout(() => {
      createLabels(0, 0, middle, monthes, dynamic);
    }, 100);
  }
}

function createLabels(min, max, middle, monthes, dynamic) {
  if (dynamic) {
    document.querySelector('.chart__max').innerHTML = max;
    document.querySelector('.chart__min').innerHTML = min;

    for (let i = 0; i < monthes.length; i++) {
      let item = el('.chart__monthes_item', monthes[i]);
      document.querySelector('.chart__monthes').append(item);
    }
  } else {
    document.querySelector('.__second_max').innerHTML = document.querySelector('.chart__max').innerHTML;
    document.querySelector('.__second_min').innerHTML = document.querySelector('.chart__min').innerHTML = min;
    document.querySelector('.chart__middle').innerHTML = middle;

    for (let i = 0; i < monthes.length; i++) {
      let item = el('.chart__monthes_item', monthes[i]);
      document.querySelector('.__second_monthes').append(item);
    }
  }
}
