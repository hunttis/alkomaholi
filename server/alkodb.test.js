require('jest');
const AlkoDB = require('./alkodb');
const moment = require('moment');

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

describe('mongorelated', () => {
  process.env.LOCAL = true;
  const alkodb = new AlkoDB();

  test('', () => {
    alkodb.storeCache(moment(), 'DONE');
  });
});
