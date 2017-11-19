'use strict';

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
    // setTimeout(() => this.getDataForSpecificDay(moment()), 5000);
  }

  getDataForSpecificDay(forDate) {
    console.log("-----*****----- Db class: " + !!this.alkodb + " DB Ready: " + this.alkodb?this.alkodb.isDBReady():"Not there");
    if (!this.alkodb || !this.alkodb.isDBReady()) {
      console.log("nope");
      return {};
    }
    var dateString = this.formatDate(forDate);
    console.log("Trying to load data for date: " + dateString);  

    // var cachedData = JSON.parse(localCache.getItem("alkodata" + dateString));
    return this.alkodb.checkIfCached(forDate).then((dayAlreadyCached) => {
      console.log("DATABASE WOULD CONTAIN CACHED DATA? ", dayAlreadyCached);
      
      if (dayAlreadyCached) {
        console.log('Using cached data');
        return this.alkodb.checkIfCached(forDate);
      } else {
        console.log('No cached data, retrieving from Alko');
        return this.retrieveData(forDate).then((resultDate) => {
          console.log("USING DATA FOR: " + resultDate);
          return this.alkodb.checkIfCached(resultDate);
        }).then((results) => {
          return results;
        });
      }  
    });
  }

  retrieveData(forDate) {
    var dateString = this.formatDate(forDate);
    console.log("Loading data for: " + dateString);
    
    var fullUrl = urlStart + filenameStart + dateString + fileExtension;
    console.log("Loading from URL: ", fullUrl);
    
    return fetch(fullUrl)
    .then(response => response.buffer())
    .then(async buffer => {
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

      if (modifiedSheet && modifiedSheet.length > 0) {
        console.log("SHEET SIZE: ", modifiedSheet.length);
        let cacheResult = await this.alkodb.storeCache(forDate, 'PROCESSING');
        let bulkResult = await this.alkodb.storeBulk(forDate, data);
        let cacheDoneResult = await this.alkodb.storeCache(forDate, 'DONE');       
      } else {
        console.log('No sheet!');
      }

      return forDate;
    })
    .catch((error) => {
      console.log('Error occured', error);
      console.log("No data for this day on alko's servers!");
      var dayBefore = moment(forDate).subtract(1, 'day');
      if (dayBefore.isAfter(moment().subtract(4, 'days'))) {
        // return this.getDataForSpecificDay(dayBefore);
        return new Promise();
      } else {
        console.log("No data found in the last few days!");
      }
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