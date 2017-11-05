'use strict';

const express = require('express');
const http = require('http');
const cors = require('cors');
const moment = require('moment');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');

const AlkoLoader = require('./alkoloader');
const alkoLoader = new AlkoLoader();

fetch.Promise = Bluebird;

const app = express();
app.use(cors());

const server = http.createServer(app);

initializeServer();

function initializeServer() {
  const today = moment();
  // console.log('ALL FOR DAY:', alkoLoader.getAllDataForDay(moment()));
}

app.get('/alldata', function(req, res, next) {
  var results = alkoLoader.getAllDataForDay(moment()).then((result) => {
    console.log('Results are here', result.length);
    res.json(result);
  });
  
});

function matches(searchTerms, searchFrom) {
  const haystack = searchFrom.join('').toLowerCase();
  if (!haystack) {
    return false;
  }

  const needles = searchTerms.split(/\W/);
  return needles.reduce((acc, searchTerm) => { return acc && haystack.includes(searchTerm.toLowerCase())}, true);
}

app.get('/data', function(req, res, next) {
  console.log('Request parameters: ', req.query);

  const searchTerms = req.query.query || 'dom';

  const filteredData = loadedData.filter(data => {
    // console.log('Checking', data);
    return matches(searchTerms, [data.nimi, data.tyyppi]);
  });

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
