const moment = require('moment');
const Cloudant = require('cloudant');

const cloudantUser = process.env.CLOUDANT_USER || "admin";
const cloudantPass = process.env.CLOUDANT_USER || "pass";
const cloudantUrl = process.env.CLOUDANT_URL || 'http://localhost:8081';

class AlkoDB {

  constructor() {
    console.log('Cloudant set up starting');
    
    this.cloudant = Cloudant({
      url: cloudantUrl, 
      account: cloudantUser, 
      password: cloudantPass,
      plugin: 'promises'}, (err, cloudant, reply) => {
      if (reply) {
        console.log('Got reply', reply);
      }
      if (err) {
        console.log('Or maybe error', err);  
      }
      this.cloudant.db.list((err, alldbs) => {
        if (alldbs) {
          console.log('-- All', alldbs.join(', '));
          if (alldbs.indexOf('alkodata') == -1) {
            console.log('Creating alkodata db');
            this.createDb('alkodata');
          } else {
            console.log('Alko data already exists');
          }
    
          if (alldbs.indexOf('cachelog') == -1) {
            console.log('Creating cache log db');
            this.createDb('cachelog');
          } else {
            console.log('Cache log already exists');
          }
        } else {
          console.log('-- No dbs, creating..');
          this.createDb('alkodata');
          this.createDb('cachelog');
        }
        console.log('Cloudant set up complete');
        // console.log(this.getDataForDay(moment()));
      });
    });
  }

  createDb(dbName) {
    console.log('TRYING TO CREATE DB:', dbName);
    this.cloudant.db.create(dbName, (err, body) => {
      if (err) {
        console.log(dbName, 'DB CREATE ERR:', err);
      }
      if (body) {
        console.log(dbName, 'DB CREATE BODY:', body);
      }
    })
  }
  
  storeBulk(date, data) {
    var cachedb = this.cloudant.db.use('cachelog');
    console.log('CACHE');
    cachedb.insert({date}, 'cached-' + date.format('DD.MM.YYYY'), (err, body) => {
      if (err) {
        console.log(Object.keys(err));
        console.log(err.reason);
        console.log(err.description);
      } else {
        console.log('Cache insert operation ok!');
      }
    });

    var db = this.cloudant.db.use('alkodata');
    
    console.log('Bulk operation starting..');
    db.bulk({docs: data}, (err) => {
      if (err) {
        console.log(Object.keys(err));
        console.log(err.reason);
        console.log(err.description);
        console.log('... BULK OPERATION FAILED!');
      } else {
        console.log('... Bulk operation ok!');
      }
    });
  }

  checkIfCached(date) {
    // return false;
    var cachedb = this.cloudant.db.use('cachelog');
    var cachedData = cachedb.get('cached-' + date.format('DD.MM.YYYY'), (err, body) => {
      if (err) {
        console.log('********** ERROR IN CACHE ACCESS');
        console.log(err);
        console.log('ERROR IN CACHE ACCESS **********');
      }
      if (body) {
        console.log('********** Cache body');
        console.log(body);
        console.log('Cache body **********');
      }
    });
    return !!cachedData;
  }

  getDataForDay(date) {
    const db = this.cloudant.db.use('alkodata');
    const dateQuery = date.format('DD.MM.YYYY');
    return db.list({include_docs: true}).then(result => {
      console.log("Result size: ", result.rows.length);
      console.log("Result Row: ", result.rows[1]);

      return result.rows
        .filter(item => item.doc.pvm === dateQuery)
        .map(item => item.doc);
    }).catch((err) => {
      console.log("ERROR", err);
      return {};
    })

    // return {}
    // return db.list().filter(item => {
    //   return item.pvm === dateQuery
    // });
    // .then((result) => {
    //   console.log('All data for day successful', result.length);
    //   // console.log(result);
    //   return result;
    // })
    // .catch((err) => {
    //   console.log('**** ERROR GETTING DATA FOR DATE');
    //   console.log(err);
    //   console.log('ERROR GETTING DATA FOR DATE ****');
    //   return {};
    // })
  }

  getDataWithTerms(searchTerms) {

  }

}

module.exports = AlkoDB;