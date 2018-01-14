require('jest');
const fs = require('fs');

const AlkoLoader = require('./alkoloader');
const moment = require('moment');

describe('formatdate', () => {
  const alkoloader = new AlkoLoader({});

  test('formatdate does not format js dates', () => {
    expect(() => {
      alkoloader.formatDate(new Date());
    }).toThrow(TypeError);
  });

  test('formatdate formats moment date', () => {
    const result = alkoloader.formatDate(moment('20111031', 'YYYYMMDD'));
    expect(result).toBe('31.10.2011');
  });
});

describe('excel parser', () => {
  const alkoloader = new AlkoLoader({});

  test('parsesheet successfully parses xls', () => {
    const file = fs.readFileSync('test-hinnasto.xls');
    const result = alkoloader.parseSheet(file, moment());

    // All these are based on the file I've downloaded from Alko for testing use
    expect(result[0].nro).toBe('440567');
    expect(result[0].nimi).toBe('Alamos Malbec 2016');
    expect(result.length).toBe(7023);
  });
});
