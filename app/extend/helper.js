const crypto = require('crypto');
const _ = require('lodash');

exports._ = _;

exports.md5 = str => {
  return crypto.createHash('md5').update(str).digest('hex');
};

// module.exports = {
//   md5(str) {
//     return crypto.createHash('md5').update(str).digest('hex');
//   },
// };

