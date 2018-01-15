const configuration = {
  mongoURL: process.env.MONGO_URL,
  mongoOptions: {
    keepAlive: true,
    reconnectTries: 10,
    useMongoClient: true,
  },
  urlStart: 'https://www.alko.fi/INTERSHOP/static/WFS/Alko-OnlineShop-Site/-/Alko-OnlineShop/fi_FI/Alkon%20Hinnasto%20Tekstitiedostona/',
  filenameStart: 'alkon-hinnasto-tekstitiedostona',
  fileExtension: '.xls',
  alkoHeaders: ['nro', 'nimi', 'valmistaja', 'pullokoko', 'hinta', 'litrahinta',
    'uutuus', 'hinnastojärjestys', 'tyyppi', 'erityisryhmä', 'oluttyyppi',
    'valmistusmaa', 'alue', 'vuosikerta', 'etikettimerkintöjä', 'huomautus',
    'rypäleet', 'luonnehdinta', 'pakkaustyyppi', 'suljentatyyppi', 'alkoholi-%',
    'hapot g/l', 'sokeri g/l', 'kantavierrep-%', 'väri', 'katkerot', 'energia', 'valikoima', 'pvm', '_id'],
};

module.exports = configuration;
