'use strict';

var localStorage;

class LocalCache {

  constructor() {
    console.log('Creating local cache');
    if (typeof localStorage === "undefined" || localStorage === null) {
      console.log("Create local storage");
      var LocalStorage = require('node-localstorage').LocalStorage;
      localStorage = new LocalStorage('./alko', 100 * 1024 * 1024);
      console.log("Created local storage");
    }
  }

  getItem(itemName) {
    console.log('Trying to find item "' + itemName + '" from cache');
    return localStorage.getItem(itemName);
  }

  setItem(itemName, item) {
    localStorage.setItem(itemName, item);
  }

}

module.exports = LocalCache;