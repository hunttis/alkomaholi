'use strict';

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

var AlkoLoader = require('./alkoloader');
var alkoLoader = new AlkoLoader();
console.log(alkoLoader);

fetch.Promise = Bluebird;

var app = express();
app.use(cors());

var localStorage;
var loadedData;

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
  loadedData = alkoLoader.getDataForSpecificDay(today);
}

app.get('/alldata', function(req, res, next) {
  res.json(loadedData);
});

function matches(searchFor, searchFrom = '') {
  return searchFrom.toLowerCase().includes(searchFor.toLowerCase())
}

app.get('/data', function(req, res, next) {
  console.log('Request parameters: ', req.query);

  const searchTerms = req.query.query || "dom";
  console.log('searchTerms', searchTerms)

  const filteredData = loadedData.filter(data => matches(searchTerms, data.nimi) || matches(searchTerms, data.tyyppi));

  res.json(filteredData);
});

app.get('/refreshdata', function(req, res, next) {
  initializeServer();
  res.send('Refreshing.. <a href="/">Back to frontpage</a>');
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
