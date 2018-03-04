const mongoose = require('mongoose');

const day = mongoose.model('Day', new mongoose.Schema({
  dateString: String,
  status: String,
}));

module.exports = day;
