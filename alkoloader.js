'use strict';

const LocalCache = require('./localcache');
const localCache = new LocalCache();

const urlStart = "https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/";
const filenameStart = "alkon-hinnasto-tekstitiedostona";
const fileExtension = ".xls";
const alkoHeaders = ["nro", "nimi", "valmistaja", "pullokoko", "hinta", "litrahinta", 
"uutuus", "hinnastojärjestys", "tyyppi", "erityisryhmä", "oluttyyppi", 
"valmistusmaa", "alue", "vuosikerta", "etikettimerkintöjä", "huomautus", 
"rypäleet", "luonnehdinta", "pakkaustyyppi", "suljentatyyppi", "alkoholi-%", 
"hapot g/l", "sokeri g/l", "kantavierrep-%", "väri", "katkerot", "energia", "valikoima"];

class AlkoLoader {

  constructor() {
    console.log('Creating alkoloader');
  }

  getDataForSpecificDay(forDate) {
    var dateString = this.formatDate(forDate);
    console.log("Trying to load data for date: " + dateString);  
    var cachedData = JSON.parse(localCache.getItem("alkodata" + dateString));
    if (cachedData) {
      console.log('Using cached data');
      return cachedData;
    } else {
      console.log('No cached data, retrieving from Alko');
      return retrieveData(forDate);
    }
  }

  retrieveData(forDate) {
    var dateString = this.formatDate(forDate);
    console.log("Loading data for: " + dateString);
    
    var fullUrl = urlStart + filenameStart + dateString + fileExtension;
    console.log("No data yet, loading from: ", fullUrl);
    
    fetch(fullUrl)
    .then(response => response.buffer())
    .then(buffer => {
      var wb = xlsx.read(buffer, {type: "buffer"});
      console.log("writing workbook..");
      localCache.setItem("alkodata", JSON.stringify(wb));
      console.log("writing worksheet..", wb.SheetNames);
      var sheet = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], 
        {header: alkoHeaders});
        localCache.setItem("alkodata" + dateString, JSON.stringify(sheet));
      loadedData = sheet;
      console.log("--- End of data");
      // res.send("server ready");
      // res.send(JSON.stringify(loadedData));
    })
    .catch((error) => {
      console.log("No data for this day on alko's servers!");
      var dayBefore = moment().subtract(1, 'day');
      return getDataForSpecificDay(dayBefore);
    });
  }

  formatDate(date) {
    return date.format('DD.MM.YYYY');
  }
}

module.exports = AlkoLoader;