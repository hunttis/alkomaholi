const moment = require('moment');
const _ = require('underscore');
const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

const productSchema = mongoose.Schema({
  nro: String,
  nimi: String,
  valmistaja: String,
  pullokoko: String,
  hinta: String,
  litrahinta: String,
  uutuus: String,
  hinnastojärjestys: String,
  tyyppi: String,
  erityisryhmä: String,
  oluttyyppi: String,
  valmistusmaa: String,
  alue: String,
  vuosikerta: String,
  etikettimerkintöjä: String,
  huomautus: String,
  rypäleet: String,
  luonnehdinta: String,
  pakkaustyyppi: String,
  suljentatyyppi: String,
  'alkoholi-%': String,
  'hapot g/l': String,
  'sokeri g/l': String,
  'kantavierrep-%': String,
  väri: String,
  katkerot: String,
  energia: String,
  valikoima: String,
  pvm: String,
  _id: String,
});

const Product = mongoose.model('Product', productSchema);

const daySchema = mongoose.Schema({
  _id: String,
  status: String,
});

const Day = mongoose.model('Day', daySchema);

class AlkoDB {
  constructor() {
    console.log('Mongo set up starting');

    if (process.env.LOCAL) {
      console.log('RUNNING LOCAL ENV!!');
    } else {
      console.log('NOT RUNNING LOCAL!!!');
    }

    let mongoURL;
    if (process.env.LOCAL) {
      console.log('Using local opts');
      mongoURL = 'mongodb://localhost:27017';
    } else {
      console.log('Using remote opts');
      mongoURL = process.env.MONGO_URL;
    }


    mongoose.connect(mongoURL).then(() => {
      console.log('Connected to Mongo!');
    }).catch((err) => {
      console.log('Error occured upon mongo connection!', err);
    });
  }


  static async storeCache(date, status) {
    let day = await Day.findById({ _id: date.format('DD.MM.YYYY') });

    if (!day) {
      console.log('No existing day');
      day = new Day({ _id: date.format('DD.MM.YYYY'), status });
    } else {
      console.log('Existing day, just setting status', day);
      day.status = status;
    }

    day.save().then((result) => {
      console.log('Day Status saved', day, !!result);
    }).catch((err) => {
      console.log('Failed to save day status', day, err);
    });
  }

  static storeBulk(date, data) {
    console.log('Bulk operation starting..');
    Product.collection.insert(data).then((result) => {
      console.log('Saved', data.length, 'products successfully!', result.length);
    }).catch((err) => {
      console.log('Something went wrong with the product bulk operation', err);
    });
  }

  static isDBReady() {
    return !!mongoose;
  }

  static getDay(date) {
    console.log('Trying to find day: ', date.format('DD.MM.YYYY'));
    return Day.findById({ _id: date.format('DD.MM.YYYY') });
  }

  checkIfCached(date) {
    return this.getDay(date).then((day) => {
      if (day && day.status === 'DONE') {
        console.log('Yes we do!');
        return true;
      }
      console.log('No we don\'t!');
      return false;
    }).catch((err) => {
      console.log('Some unexpected error occured!', err);
      return false;
    });
  }

  static getDataForDay(date) {
    const dateQuery = date.format('DD.MM.YYYY');
    return Product.find({ pvm: dateQuery }).then((result) => {
      console.log('Result size: ', result.length);
      console.log(result);
      return result;
    }).catch((err) => {
      console.log('ERROR IN DB', err);
      return {};
    });
  }

  async getDataWithTerms(searchTerms) {
    const needles = searchTerms.split(/\W/);
    console.log('needles', needles);

    const searches = needles.map(async (term) => {
      console.log('searching..', term);
      return this.searchFromDB(term);
    });

    return Promise.all(searches).then((results) => {
      // console.log(results);
      const final = results.map((list) => {
        console.log('List length:', list.length);

        const matchedItems = [];

        list.forEach((item) => {
          let itemOnEachList = true;
          results.forEach((listToCheck) => {
            let itemOnList = false;
            listToCheck.forEach((itemToCompareTo) => {
              if (itemToCompareTo.nro === item.nro) {
                itemOnList = true;
              }
            });
            if (!itemOnList) {
              itemOnEachList = false;
            }
          });
          if (itemOnEachList) {
            matchedItems.push(item);
          }
        });
        return matchedItems;
      });

      const finalResult = _.uniq(_.flatten(final), item => item.nro);
      console.log('Final result new way: ', finalResult.length);

      return finalResult;
    });
  }

  static searchFromDB(searchTerm) {
    console.log('SEARCHING DB FOR', searchTerm);
    const dateQuery = moment().format('DD.MM.YYYY');
    const regex = new RegExp(`.*${searchTerm}.*`, 'i');

    return Product.find({ pvm: dateQuery }).or([
      { nimi: regex },
      { valmistaja: regex },
      { tyyppi: regex },
      { valmistusmaa: regex },
    ]);
  }
}

module.exports = AlkoDB;
