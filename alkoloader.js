'use strict';

// const LocalCache = require('./localcache');
// const localCache = new LocalCache();
const fetch = require('node-fetch');
const moment = require('moment');
const xlsx = require('xlsx');
const AlkoDB = require('./alkodb');

const Bluebird = require('bluebird');
fetch.Promise = Bluebird;


const urlStart = "https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/";
// const urlStart = "http://localhost:8080/";
const filenameStart = "alkon-hinnasto-tekstitiedostona";
const fileExtension = ".xls";
const alkoHeaders = ["nro", "nimi", "valmistaja", "pullokoko", "hinta", "litrahinta", 
"uutuus", "hinnastojärjestys", "tyyppi", "erityisryhmä", "oluttyyppi", 
"valmistusmaa", "alue", "vuosikerta", "etikettimerkintöjä", "huomautus", 
"rypäleet", "luonnehdinta", "pakkaustyyppi", "suljentatyyppi", "alkoholi-%", 
"hapot g/l", "sokeri g/l", "kantavierrep-%", "väri", "katkerot", "energia", "valikoima", "pvm", "_id"];

class AlkoLoader {

  constructor() {
    console.log('Creating alkoloader');
    this.alkodb = new AlkoDB();
    this.getDataForSpecificDay(moment());
  }

  getDataForSpecificDay(forDate) {
    var dateString = this.formatDate(forDate);
    console.log("Trying to load data for date: " + dateString);  

    // var cachedData = JSON.parse(localCache.getItem("alkodata" + dateString));
    const dayAlreadyCached = this.alkodb.checkIfCached(forDate);
    console.log("DATABASE WOULD CONTAIN CACHED DATA? ", dayAlreadyCached);

    if (dayAlreadyCached) {
      console.log('Using cached data');
    } else {
      console.log('No cached data, retrieving from Alko');
      this.retrieveData(forDate);
    }
  }

  retrieveData(forDate) {
    var dateString = this.formatDate(forDate);
    console.log("Loading data for: " + dateString);
    
    var fullUrl = urlStart + filenameStart + dateString + fileExtension;
    console.log("Loading from URL: ", fullUrl);
    
    return fetch(fullUrl)
    .then(response => response.buffer())
    .then(buffer => {
      var wb = xlsx.read(buffer, {type: "buffer"});

      console.log("writing worksheet..", wb.SheetNames);
      const JSONsheet = JSON.stringify(sheet);

      var sheet = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], 
        {header: alkoHeaders});

      var index = 0;

      // Only store value if it's part of the actual data and not alko notes or headers
      var modifiedSheet = sheet.map(item => {
        if (!Number.isNaN(parseInt(item.nro))) {          
          item.pvm = this.formatDate(forDate);
          item._id = this.formatDate(forDate) + "-" + item.nro;
          return item;
        }
      }).filter(item => {
        if (item) {
          return item;
        }
      });

      console.log("SHEET SIZE: ", modifiedSheet.length);

      this.alkodb.storeBulk(forDate, modifiedSheet);
      return modifiedSheet;
    })
    .catch((error) => {
      console.log(error);
      console.log("No data for this day on alko's servers!");
      var dayBefore = forDate.subtract(1, 'day');
      if (dayBefore.isBetween(moment(forDate).add(1, 'days'), moment(forDate).subtract(7, 'days'))) {
        return this.getDataForSpecificDay(dayBefore);
      }
      console.log("Day", dayBefore, "is not between", moment(forDate).add(1, 'days'), "and", moment(forDate).subtract(7, 'days'));
      console.log("No data found in the previous week!");
    });
  }

  formatDate(date) {
    return date.format('DD.MM.YYYY');
  }

  searchData(searchTerms) {
    return this.alkodb.getDataWithTerms(searchTerms);
  }

  getAllDataForDay(date) {
    console.log('Finding...');
    return this.alkodb.getDataForDay(date).then((result) => {
      return result;
    });
  }
}

module.exports = AlkoLoader;