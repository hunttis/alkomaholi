module.exports = {
  "extends": "airbnb",
  "plugins": [
      "react",
      "jest"
  ],
  "rules": {
    "no-use-before-define": [1, "nofunc"],
    "no-param-reassign": [1,{"props":true}],
    "no-underscore-dangle": ["error", { "allow": ["_id"] }],
    "no-console": 0,
    "class-methods-use-this": 0
  },
  "env": {
    "jest/globals": true
  }
  
};
