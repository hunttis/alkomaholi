const fetch = require('node-fetch');
const moment = require('moment');
const xlsx = require('xlsx');
const AlkoDB = require('./alkodb');
const Bluebird = require('bluebird');

fetch.Promise = Bluebird;


const urlStart = 'https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/';
// const urlStart = "http://localhost:8080/";
const filenameStart = 'alkon-hinnasto-tekstitiedostona';
const fileExtension = '.xls';
const alkoHeaders = ['nro', 'nimi', 'valmistaja', 'pullokoko', 'hinta', 'litrahinta',
  'uutuus', 'hinnastojärjestys', 'tyyppi', 'erityisryhmä', 'oluttyyppi',
  'valmistusmaa', 'alue', 'vuosikerta', 'etikettimerkintöjä', 'huomautus',
  'rypäleet', 'luonnehdinta', 'pakkaustyyppi', 'suljentatyyppi', 'alkoholi-%',
  'hapot g/l', 'sokeri g/l', 'kantavierrep-%', 'väri', 'katkerot', 'energia', 'valikoima', 'pvm', '_id'];

class AlkoLoader {
  constructor() {
    console.log('Creating alkoloader');
    this.alkodb = new AlkoDB();
    // setTimeout(() => this.getDataForSpecificDay(moment()), 5000);
  }

  getDataForSpecificDay(forDate) {
    if (!this.alkodb) {
      console.log('Database was not yet ready.');
      return {};
    }

    const dateString = this.formatDate(forDate);
    console.log(`Trying to load data for date: ${dateString}`);

    // var cachedData = JSON.parse(localCache.getItem("alkodata" + dateString));
    return this.alkodb.checkIfCached(forDate).then((dayAlreadyCached) => {
      console.log('DATABASE WOULD CONTAIN CACHED DATA? ', dayAlreadyCached);

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

    const fullUrl = urlStart + filenameStart + dateString + fileExtension;
    console.log('Loading from URL: ', fullUrl);

    return fetch(fullUrl)
      .then(response => response.buffer())
      .then(async (buffer) => {
        const wb = xlsx.read(buffer, { type: 'buffer' });

        console.log(`writing worksheet.. ${wb.SheetNames}`);

        const sheet = xlsx.utils
          .sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: alkoHeaders });

        // Only store value if it's part of the actual data and not alko notes or headers
        const modifiedSheet = sheet.map((productitem) => {
          if (!Number.isNaN(parseInt(productitem.nro, 10))) {
            productitem.pvm = this.formatDate(forDate);
            productitem._id = `${this.formatDate(forDate)}-${productitem.nro}`;
            return productitem;
          }
          return null;
        }).filter(item => !!item);

        if (modifiedSheet && modifiedSheet.length > 0) {
          console.log('SHEET SIZE: ', modifiedSheet.length);
          await this.alkodb.storeCache(forDate, 'PROCESSING');
          await this.alkodb.storeBulk(forDate, modifiedSheet);
          await this.alkodb.storeCache(forDate, 'DONE');
        } else {
          console.log('No sheet!');
        }

        return this.formatDate(forDate);
      })
      .catch((error) => {
        if (error.toString().includes('could not find <table>')) {
          console.log(`No data for ${forDate} day on alko's servers!`);
        } else {
          console.log('Error occured', error);
        }
        const dayBefore = moment(forDate).subtract(1, 'day');
        if (dayBefore.isAfter(moment().subtract(4, 'days'))) {
          console.log('Trying to find data for previous day', this.formatDate(dayBefore));
          return this.getDataForSpecificDay(dayBefore);
        }
        console.log('No data found in the last few days!');
        return new Promise();
      });
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
