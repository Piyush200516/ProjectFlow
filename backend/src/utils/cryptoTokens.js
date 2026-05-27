const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createOpaqueToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

module.exports = {
  sha256,
  createOpaqueToken,
  addMinutes,
  addDays,
};
