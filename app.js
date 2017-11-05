'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');
const moment = require('moment');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');

const AlkoLoader = require('./alkoloader');
const alkoLoader = new AlkoLoader();
console.log(alkoLoader);

fetch.Promise = Bluebird;

const app = express();
app.use(cors());

let localStorage;
let loadedData;

if (typeof localStorage === "undefined" || localStorage === null) {
  console.log("Create local storage");
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./alko', 20 * 1024 * 1024);
  console.log("Created local storage");
}

// var loadedData = JSON.parse(localStorage.getItem("alkodata" + dateString));
const server = http.createServer(app);

initializeServer();

function initializeServer() {
  const today = moment();
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

const port = process.env.PORT || 8080;
app.set('port', port);

server.listen(port);
server.on('listening', onListening);

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

module.exports = app;
