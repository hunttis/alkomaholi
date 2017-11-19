module.exports = {
  "extends": "airbnb",
  "plugins": [
      "react"
  ],
  "rules": {
    "no-use-before-define": [1, "nofunc"],
    "no-param-reassign": [1,{"props":true}],
    "no-underscore-dangle": ["error", { "allow": ["_id"] }]
  }
};