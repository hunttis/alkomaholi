require('jest');
const AlkoLoader = require('./alkoloader');
const moment = require('moment');

describe('formatdate', () => {
  const alkoloader = new AlkoLoader();

  test('formatdate does not format js dates', () => {
    expect(() => {
      alkoloader.formatDate(new Date());
    }).toThrow(TypeError);
  });

  test('formatdate formats moment date', () => {
    const result = alkoloader.formatDate(moment('20111031', 'YYYYMMDD'));
    console.log('Formatted to: ', result);
    expect(result).toBe('31.10.2011');
  });
});

