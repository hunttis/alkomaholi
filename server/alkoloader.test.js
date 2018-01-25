require('jest');
const fs = require('fs');

const AlkoDB = require('./alkodb');
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
    // console.log(result[0]);
    // All these are based on the file I've downloaded from Alko for testing use
    expect(result[0].nro).toBe('440567');
    expect(result[0].nimi).toBe('Alamos Malbec 2016');
    expect(result.length).toBe(7023);
  });
});

describe('store sheet stores sheet', async () => {
  const alkodb = new AlkoDB();
  const alkoloader = new AlkoLoader(alkodb);

  test('test store', async () => {
    console.log('Storing...');
    const result = await alkoloader.storeSheetInDb([testData]);
    console.log('Result of storing in DB', result);
  });
});

const testData = {
  nro: '440567',
  nimi: 'Alamos Malbec 2016',
  valmistaja: 'Alamos',
  pullokoko: '0,75 l',
  hinta: '10.50',
  litrahinta: '13.87',
  hinnastojärjestys: '110',
  tyyppi: 'punaviinit',
  valmistusmaa: 'Argentiina',
  alue: 'Mendoza',
  vuosikerta: '2016',
  etikettimerkintöjä: 'Mendoza',
  rypäleet: 'Malbec, ',
  luonnehdinta: 'Täyteläinen, keskitanniininen, luumuhilloinen, kypsän karpaloinen, hennon kukkainen, mausteinen',
  pakkaustyyppi: 'pullo',
  suljentatyyppi: 'metallinen kierrekapseli',
  'alkoholi-%': '12.5',
  'hapot g/l': '4.6',
  'sokeri g/l': '2',
  energia: '70.0',
  valikoima: 'vakiovalikoima',
  pvm: '21.01.2018',
  _id: '21.01.2018-440567',
};

