const mongoose = require('mongoose');

const dayModel = mongoose.model('Day', mongoose.Schema({
  _id: String,
  status: String,
}));

module.exports = dayModel;
