require('jest');
const AlkoDB = require('./alkodb');
const moment = require('moment');

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const configuration = require('./config/configloader');

describe('mongorelated', () => {
  const alkodb = new AlkoDB(configuration);

  test('', () => {
    alkodb.storeCache(moment(), 'DONE');
  });
});
