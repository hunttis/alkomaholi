const mongoose = require('mongoose');

const productModel = mongoose.model('Product', mongoose.Schema({
  nro: String,
  nimi: String,
  valmistaja: String,
  pullokoko: String,
  hinta: String,
  litrahinta: String,
  uutuus: String,
  hinnastojärjestys: String,
  tyyppi: String,
  erityisryhmä: String,
  oluttyyppi: String,
  valmistusmaa: String,
  alue: String,
  vuosikerta: String,
  etikettimerkintöjä: String,
  huomautus: String,
  rypäleet: String,
  luonnehdinta: String,
  pakkaustyyppi: String,
  suljentatyyppi: String,
  'alkoholi-%': String,
  'hapot g/l': String,
  'sokeri g/l': String,
  'kantavierrep-%': String,
  väri: String,
  katkerot: String,
  energia: String,
  valikoima: String,
  pvm: String,
  _id: String,
  historia: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Historia' }],
}));

module.exports = productModel;