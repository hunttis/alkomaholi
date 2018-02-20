const mongoose = require('mongoose');

const historiaModel = mongoose.model('Historia', mongoose.Schema({
  pvm: String,
  hinta: String,
}));

module.exports = historiaModel;
