var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var http = require('http');
var xlsx = require('xlsx');

var cors = require('cors');
var moment = require('moment');

var app = express();

var fetch = require('node-fetch');
var fileType = require('file-type');
var Bluebird = require('bluebird');
fetch.Promise = Bluebird;

var app = express();
app.use(cors());

var urlStart = "https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/";
var filenameStart = "alkon-hinnasto-tekstitiedostona";
var fileExtension = ".xls";
var alkoHeaders = ["nro", "nimi", "valmistaja", "pullokoko", "hinta", "litrahinta", 
"uutuus", "hinnastojärjestys", "tyyppi", "erityisryhmä", "oluttyyppi", 
"valmistusmaa", "alue", "vuosikerta", "etikettimerkintöjä", "huomautus", 
"rypäleet", "luonnehdinta", "pakkaustyyppi", "suljentatyyppi", "alkoholi-%", 
"hapot g/l", "sokeri g/l", "kantavierrep-%", "väri", "katkerot", "energia", "valikoima"];


if (typeof localStorage === "undefined" || localStorage === null) {
  console.log("Create local storage");
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./alko', 20 * 1024 * 1024);
  console.log("Created local storage");
}

// var loadedData = JSON.parse(localStorage.getItem("alkodata" + dateString));
var server = http.createServer(app);

initializeServer();

function initializeServer() {
  var today = moment();
  loadedData = getDataForSpecificDay(today);
}

function retrieveData(forDate) {
  var dateString = forDate.format('D.M.YYYY');
  console.log("Loading data for: " + dateString);
  
  var fullUrl = urlStart + filenameStart + dateString + fileExtension;
  console.log("No data yet, loading from: ", fullUrl);
  
  fetch(fullUrl)
  .then(response => response.buffer())
  .then(buffer => {
    var wb = xlsx.read(buffer, {type: "buffer"});
    console.log("writing workbook..");
    localStorage.setItem("alkodata", JSON.stringify(wb));
    console.log("writing worksheet..", wb.SheetNames);
    var sheet = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], 
      {header: alkoHeaders});
    localStorage.setItem("alkodata" + dateString, JSON.stringify(sheet));
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

function getDataForSpecificDay(forDate) {
  var dateString = forDate.format('D.M.YYYY');
  console.log("Trying to load data for date: " + dateString);  
  var cachedData = JSON.parse(localStorage.getItem("alkodata" + dateString));
  if (cachedData) {
    return cachedData;
  } else {
    return retrieveData(forDate);
  }
}

app.use('/alldata', function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token");
  res.send(JSON.stringify(loadedData));
});

app.use('/data', function(req, res, next) {
  console.log('Request parameters: ', req.query);

  var searchTerms = req.query.query;
  if (!searchTerms) {
    searchTerms = "dom";
  }

  var filteredData = loadedData.filter(data => {
    // console.log('Checking', data);
    if (data.nimi) {
      return data.nimi.toLowerCase().indexOf(searchTerms.toLowerCase()) !== -1
    }
    return false;
  });

  res.send(JSON.stringify(filteredData));
});

app.use(express.static('public'));

var port = process.env.PORT || 8080;
app.set('port', port);

server.listen(port);
server.on('listening', onListening);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

module.exports = app;
