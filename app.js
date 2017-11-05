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
  alkoLoader.getAllDataForDay(moment()).then((result) => {
    console.log("Today's result size: " + result.length);
  });
}

app.get('/alldata', function(req, res, next) {
  alkoLoader.getAllDataForDay(moment()).then((result) => {
    console.log('Results are here', result.length);
    res.json(result);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

app.get('/data', function(req, res, next) {
  console.log('Request parameters: ', req.query);

  const searchTerms = req.query.query || 'dom';

  alkoLoader.searchData(searchTerms).then((results) => {
    res.json(results);
  }).catch((err) => {
    res.status(500).json({});
  })
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
