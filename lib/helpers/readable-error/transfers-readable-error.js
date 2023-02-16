const { scan } = require('./util');

/**
 * List of error keywords of the module.
 * Each object should have keyword and readableError properties
 * 
 */
const KEYWORDS = []

/**
 * 
 * @param {string} data - Cegid response as XML string 
 * @param {int} status - HTTP Status code. Either 200 or 500 most of the time
 */
module.exports = (cegidResponse, requestBody) => {
  return scan({ cegidResponse, requestBody, keywords: KEYWORDS });
}