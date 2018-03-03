const fetch = require('node-fetch');
const xlsx = require('xlsx');
const AlkoDB = require('./alkodb');
const Bluebird = require('bluebird');

const configuration = require('./config/configloader');

fetch.Promise = Bluebird;

class AlkoLoader {
  constructor(alkodb) {
    this.alkodb = alkodb || new AlkoDB();
  }

  async getDataForSpecificDay(forDate) {
    if (!this.alkodb) {
      console.log('Database was not yet ready.');
      return {};
    }

    const dateString = this.formatDate(forDate);
    console.log(`Trying to load data for date: ${dateString}`);

    const dayAlreadyCached = await this.alkodb.checkIfCached(forDate);
    console.log('Data for', this.formatDate(forDate), 'already cached:', dayAlreadyCached);

    if (dayAlreadyCached) {
      this.alkodb.setActiveDate(forDate);
      return true;
    }

    const retrieveResult = await this.retrieveData(forDate);
    console.log('Attempted to retrieve data from ALKO servers for: ', this.formatDate(forDate), ' - Result was: ', retrieveResult);
    return retrieveResult;
  }

  retrieveData(forDate) {
    const dateString = this.formatDate(forDate);
    console.log(`Loading data for: ${dateString}`);

    const fullUrl = configuration.urlStart
        + configuration.filenameStart
        + configuration.fileExtension;

    console.log('Loading from URL: ', fullUrl);

    return fetch(fullUrl)
      .then(response => response.buffer())
      .then(async buffer => this.parseSheet(buffer, forDate))
      .then(async modifiedSheet => this.storeSheetInDb(modifiedSheet, forDate))
      .catch((err) => {
        console.log('Error with fetching the data: ', err);
        return false;
      });
  }

  parseSheet(buffer, forDate) {
    const wb = xlsx.read(buffer, { type: 'buffer' });

    console.log(`Writing worksheet: '${wb.SheetNames}'`);

    const sheet = xlsx.utils
      .sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: configuration.alkoHeaders });

    // Only store value if it's part of the actual data and not alko notes or headers
    const modifiedSheet = sheet.map((productitem) => {
      if (!Number.isNaN(parseInt(productitem.nro, 10))) {
        productitem.pvm = this.formatDate(forDate);
        productitem.rivi_id = `${this.formatDate(forDate)}-${productitem.nro}`;
        return productitem;
      }
      return null;
    }).filter(item => !!item);

    return modifiedSheet;
  }

  async storeSheetInDb(sheet, forDate) {
    if (sheet && sheet.length > 0) {
      console.log('SHEET SIZE: ', sheet.length);
      try {
        await this.alkodb.storeBulk(sheet);
        await this.alkodb.storeCache(forDate, 'DONE');
      } catch (err) {
        console.log('Error storing data to DB:', err);
        return false;
      }
    } else {
      console.log('No sheet!');
    }

    return true;
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
