const fetch = require('node-fetch');
const moment = require('moment');
const xlsx = require('xlsx');
const AlkoDB = require('./alkodb');
const Bluebird = require('bluebird');

const configuration = require('./config/configloader');

fetch.Promise = Bluebird;

class AlkoLoader {
  constructor(alkodb) {
    this.alkodb = alkodb || new AlkoDB();
  }

  getDataForSpecificDay(forDate) {
    if (!this.alkodb) {
      console.log('Database was not yet ready.');
      return {};
    }

    const dateString = this.formatDate(forDate);
    console.log(`Trying to load data for date: ${dateString}`);

    return this.alkodb.checkIfCached(forDate)
      .then((dayAlreadyCached) => {
        if (dayAlreadyCached) {
          console.log('Using cached data');
          this.alkodb.setActiveDate(forDate);
          return this.alkodb.checkIfCached(forDate) ? forDate : false;
        }
        console.log('No cached data, retrieving from Alko');
        return this.retrieveData(forDate).then((resultDate) => {
          console.log(`USING DATA FOR: ${resultDate}`);
          this.alkodb.setActiveDate(resultDate);
          return this.alkodb.checkIfCached(resultDate) ? resultDate : false;
        }).then((results) => {
          console.log('Ready to return data:', results);
          return results;
        });
      });
  }

  retrieveData(forDate) {
    const dateString = this.formatDate(forDate);
    console.log(`Loading data for: ${dateString}`);

    const fullUrl = configuration.urlStart +
        configuration.filenameStart +
        dateString +
        configuration.fileExtension;

    console.log('Loading from URL: ', fullUrl);

    return fetch(fullUrl)
      .then(response => response.buffer())
      .then(async buffer => this.parseSheet(buffer, forDate))
      .then(async modifiedSheet => this.storeSheetInDb(modifiedSheet, forDate));
  }

  parseSheet(buffer, forDate) {
    const wb = xlsx.read(buffer, { type: 'buffer' });

    console.log(`writing worksheet.. ${wb.SheetNames}`);

    const sheet = xlsx.utils
      .sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: configuration.alkoHeaders });

    // Only store value if it's part of the actual data and not alko notes or headers
    const modifiedSheet = sheet.map((productitem) => {
      if (!Number.isNaN(parseInt(productitem.nro, 10))) {
        productitem.pvm = this.formatDate(forDate);
        productitem._id = `${this.formatDate(forDate)}-${productitem.nro}`;
        return productitem;
      }
      return null;
    }).filter(item => !!item);
    
    return modifiedSheet;
  }

  async storeSheetInDb(sheet, forDate) {
    if (sheet && sheet.length > 0) {
      console.log('SHEET SIZE: ', sheet.length);
      await this.alkodb.storeCache(forDate, 'PROCESSING');
      await this.alkodb.storeBulk(forDate, sheet);
      await this.alkodb.storeCache(forDate, 'DONE');
    } else {
      console.log('No sheet!');
    }

    return forDate;
  }

  formatDate(date) {
    return date.format('DD.MM.YYYY');
  }

  searchData(searchTerms) {
    return this.alkodb.getDataWithTerms(searchTerms);
  }

  getAllDataForDay(date) {
    return this.alkodb.getDataForDay(date);
  }
}

module.exports = AlkoLoader;
