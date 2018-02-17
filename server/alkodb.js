const moment = require('moment');
const mongoose = require('mongoose');
const configuration = require('./config/configloader');

mongoose.Promise = require('bluebird');

const Historia = require('./models/Historia');
const Product = require('./models/Product');
const Day = require('./models/Day');

class AlkoDB {
  constructor() {
    this.activeDate = moment();
    console.log('Mongo set up starting');

    this.connectTomongo(configuration.mongoURL);
  }

  connectTomongo(mongoURL) {
    mongoose.connect(mongoURL, {
      keepAlive: true,
      reconnectTries: 10,
      useMongoClient: true,
    }).then(() => {
      console.log('Connected to Mongo!');
    }).catch((err) => {
      console.log('Error occured upon mongo connection!', err);
    });
  }


  async storeCache(date, status) {
    const dateId = date.format('DD.MM.YYYY');

    let day = await Day.findById({ _id: dateId });

    if (!day) {
      console.log('No existing day');
      day = new Day({ _id: dateId, status });
    } else {
      console.log('Existing day, just setting status', day);
      day.status = status;
    }

    await day.save();
    console.log('Saved day status!', status);
  }

  async storeBulk(data) {
    console.log('Bulk operation starting --->');

    try {
      const bulk = Product.collection.initializeOrderedBulkOp();

      data.forEach((item) => {
        const pvmString = item.pvm;
        item._id = item.nro;

        bulk.find({
          _id: item._id,
        }).upsert().updateOne({
          $setOnInsert: item,
          $push: { historia: { pvm: pvmString, hinta: item.hinta } },
        });

        // Update root object price to newest every time, cannot be done above,
        // because mongo doesn't allow setOnInsert and set on same field
        bulk.find({
          _id: item._id,
        }).updateOne({
          $set: { hinta: item.hinta },
        });
      });
      await bulk.execute();
      console.log('<--- Bulk operation complete!');
    } catch (err) {
      console.log('Something went wrong with the history object store', err);
    }
  }

  getDay(date) {
    const searchDate = moment(date).format('DD.MM.YYYY');
    console.log('Trying to find day: ', searchDate);
    return Day.findById({ _id: searchDate });
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

  setActiveDate(useDate) {
    console.log('USING DATE:', useDate);
    this.activeDate = useDate;
  }

  getDataForDay(date) {
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

    return this.searchFromDB(needles);
  }

  searchFromDB(searchTerms) {
    console.log('SEARCHING DB FOR', searchTerms);
    const orQuery = this.orQueries(searchTerms);
    mongoose.set('debug', true);

    console.log('Searching mongo with', JSON.stringify(orQuery));
    return Product.find({ $and: orQuery });
  }

  orQueries(searchTerms) {
    const query = [];
    searchTerms.forEach((term) => {
      const regex = new RegExp(`${term}`, 'i');
      console.log('Regex: ', regex);
      const orQuery = {
        $or: [{ nimi: regex },
          { valmistaja: regex },
          { tyyppi: regex },
          { valmistusmaa: regex },
        ],
      };
      query.push(orQuery);
      console.log('orQuery', orQuery);
    });
    return query;
  }
}

module.exports = AlkoDB;
