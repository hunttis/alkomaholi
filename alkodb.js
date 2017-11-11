const moment = require('moment');
const Cloudant = require('cloudant');

var vcapLocal;

try {
  vcapLocal = require('./conf/cloudant-credentials.json');
} catch (e) { }

const cloudantUser = process.env.LOCAL ? "admin" : vcapLocal.cloudantNoSQLDB.credentials.username;
const cloudantPass = process.env.LOCAL ? "pass" : vcapLocal.cloudantNoSQLDB.credentials.password;
const cloudantUrl = process.env.LOCAL ? 'http://localhost:8081' : vcapLocal.cloudantNoSQLDB.credentials.urlnocreds;

class AlkoDB {

  constructor() {
    console.log('Cloudant set up starting');
    
    this.memoryData = null;
    this.memoryDataDate = null;

    if (process.env.LOCAL) {
      console.log("RUNNING LOCAL ENV!!");
    } else {
      console.log("NOT RUNNING LOCAL!!!");
    }

    var cloudantOpts = {};

    if (process.env.LOCAL) {
      console.log('Using local opts');
      cloudantOpts = {
        url: cloudantUrl, 
        account: cloudantUser, 
        password: cloudantPass,
        plugin: 'promises'}
    } else {
      console.log('Using bluemix opts');
      cloudantOpts = {
        vcapServices: JSON.parse(process.env.VCAP_SERVICES),
        plugin: 'promises'}
    }

    this.cloudant = Cloudant(cloudantOpts, (err, cloudant, reply) => {

      if (reply) {
        console.log('Got reply', reply);
        this.initializeDbs(cloudant);
      }
      if (err) {
        console.log('Or maybe error', err);  
      }
    });
  }

  initializeDbs(cloudant) {
    cloudant.db.list((err, alldbs) => {
      if (alldbs) {
        console.log('-- All', alldbs.join(', '));
        if (alldbs.indexOf('alkodata') == -1) {
          console.log('Creating alkodata db');
          this.createDb(cloudant, 'alkodata');
        } else {
          console.log('Alko data already exists');
        }
  
        if (alldbs.indexOf('cachelog') == -1) {
          console.log('Creating cache log db');
          this.createDb(cloudant, 'cachelog');
        } else {
          console.log('Cache log already exists');
        }
      } else if (!err) {
        console.log('-- No dbs, creating..');
        this.createDb(cloudant, 'alkodata');
        this.createDb(cloudant, 'cachelog');
      }
      console.log('Cloudant set up complete');
      // console.log(this.getDataForDay(moment()));
      if (err) {
        console.log("RAN INTO SOME ERROR");
        console.log(err);
      }
    });
  }

  createDb(cloudant, dbName) {
    console.log('TRYING TO CREATE DB:', dbName);
    cloudant.db.create(dbName, (err, body) => {
      if (err) {
        console.log(dbName, 'DB CREATE ERR:', err);
      }
      if (body) {
        console.log(dbName, 'DB CREATE BODY:', body);
      }
    })
  }

  storeCache(date) {
    var cachedb = this.cloudant.db.use('cachelog');
    
    cachedb.insert({date}, 'cached-' + date.format('DD.MM.YYYY'), (err, body) => {
      if (err) {
        console.log('CACHE STORE ERROR');
        console.log(Object.keys(err));
        console.log(err.reason);
        console.log(err.description);
      } else {
        console.log('Cache insert operation ok!');
      }
    });
  }
  
  storeBulk(date, data) {

    var db = this.cloudant.db.use('alkodata');
    
    console.log('Bulk operation starting..');

    db.bulk({docs: data}, (err) => {
      if (err) {
        console.log('BULK OPERATION ERROR');
        console.log(Object.keys(err));
        console.log(err.reason);
        console.log(err.description);
        console.log('... BULK OPERATION FAILED!');
      } else {
        console.log('... Bulk operation ok!');
      }
    });
  }

  isDBReady() {
    return !!this.cloudant && !!this.cloudant.db;
  }

  checkIfCached(date) {
    if (this.cloudant && this.cloudant.db && this.cloudant.db.use('cachelog')) {
      var cachedb = this.cloudant.db.use('cachelog');
      return cachedb.get('cached-' + date.format('DD.MM.YYYY'), (err, body) => {
        if (err) {
          console.log('********** ERROR IN CACHE ACCESS **********');
          console.log(err && err.error ? err.error : 'Probably missing?');
          console.log('********** ERROR IN CACHE ACCESS **********');
          return false;
        } else if (body) {
          console.log('-- Cache body');
          console.log(body);
          console.log('Cache body --');
          return true;
        } else {
          console.log('No err and no body');
          return false;
        }
      }).then((result) => {
        console.log('Everything ok? ', result);
        return true;
      }).catch((err) => {
        console.log('Some unexpected error occured!');
        console.log(err);
        return false;
      })
    } else {
      console.log('-----> Cache being accessed, but not ready yet');
      return false;
    }
  }

  getDataForDay(date) {
    const db = this.cloudant.db.use('alkodata');
    const dateQuery = date.format('DD.MM.YYYY');
    return db.list({include_docs: true}).then(result => {
      console.log("Result size: ", result.rows.length);

      return result.rows
        .filter(item => item.doc.pvm === dateQuery)
        .map(item => item.doc);
    }).catch((err) => {
      console.log("ERROR IN DB", err);
      return {};
    });
  }

  async updateMemoryData() {
    if (!moment().isSame(this.memoryDataDate, 'day')){
      console.log('No data in memory yet for this day!');
      this.memoryData = await this.getDataForDay(moment());
      this.memoryDataDate = moment();
    }
    return this.memoryData;    
  }

  getDataWithTerms(searchTerms) {
    const db = this.cloudant.db.use('alkodata');

    return this.updateMemoryData().then(results => {
      return results.filter(item => this.matches(searchTerms, Object.values(item)));
    }).catch((err) => {
      console.log("ERROR IN DB TERMS SEARCH", err);
      return {};
    });  
  }
  
  matches(searchTerms, searchFrom) {
    const haystack = searchFrom.join('').toLowerCase();
    if (!haystack) {
      return false;
    }
  
    const needles = searchTerms.split(/\W/);
    return needles.reduce((acc, searchTerm) => { return acc && haystack.includes(searchTerm.toLowerCase())}, true);
  }

  isDataFromToday() {
    return moment().isSame(memoryData, 'day');
  }

}

module.exports = AlkoDB;