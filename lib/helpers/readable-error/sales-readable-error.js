const { scan } = require('./util');

/**
 * List of error keywords of the module.
 * Each object should have keyword and readableError properties
 * 
 */
const KEYWORDS = [
  {
    'keyword': 'Failed to identify document (TECommerceServicePS.CheckCancelOrder))',
    'readableError': ({ orderNumber }) => {
      return `Unable to cancel order. Reference ${orderNumber} doesn't exist in Cegid.`;
    }
  },
  {
    'keyword': 'Order cancelled. No processing authorised (TCbrECommerceHelper.CheckAnnulePieceEco))',
    'readableError': ({ orderNumber }) => {
      return `Unable to cancel order. Reference ${orderNumber} is already cancelled in Cegid.`;
    }
  }
]

/**
 * 
 * @param {string} data - Cegid response as XML string 
 * @param {int} status - HTTP Status code. Either 200 or 500 most of the time
 */
module.exports = (cegidResponse, requestBody) => {
  return scan({ cegidResponse, requestBody, keywords: KEYWORDS });
}