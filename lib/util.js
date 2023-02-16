'use strict'

const _ = require('lodash');
const PAYMENT_METHODS = require(GLOBAL_CONFIG_PATH).paymentMethods;

const util = {};

util.getPaymentMethod = (code = '9') => {
  const result = _.find(PAYMENT_METHODS, {code: code});
  
  if(result) return result.label;
  return code;
}

util.generateInvoiceTitle = (type) => {
  let label = 'TAX INVOICE';
  switch (type) {
    case 'replacement':
      label = 'WARRANTY PRODUCT REPLACEMENT NOTE';
      break;

    case 'return':
      label = 'TAX CREDIT NOTE';
      break;
  
    default:
      break;
  }

  return label;
}

module.exports = util;