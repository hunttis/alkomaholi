var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var http = require('http');
var xlsx = require('xlsx');

var cors = require('cors');

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

var loadedData = localStorage.getItem("alkodata");
var server = http.createServer(app);

var date = new Date();
var dateString = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
console.log(dateString);

app.get('/', function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token");
  if (!loadedData) {
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
        localStorage.setItem("alkodata", JSON.stringify(sheet));
        loadedData = sheet;
        console.log("--- End of data");
        res.send(JSON.stringify(loadedData));
      });
  } else {
    console.log("Using cached data..");
    res.send(JSON.stringify(loadedData));
    console.log("Sent response");
  }
});

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
